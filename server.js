require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const dns = require('dns');


app.use(bodyParser.urlencoded(
{
	extended: false
}));
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URI,
{
	useNewUrlParser: true,
	useUnifiedTopology: true
});

var db = mongoose.connection
let numRecords

const urlSchema = mongoose.Schema(
{
	url: String,
	short: Number
})

const URL_MODEL = mongoose.model('url', urlSchema)


app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res)
{
	res.sendFile(process.cwd() + '/views/index.html');

});

app.post('/api/shorturl/new', (req, res) =>
{
	//remove all sub-paths to test base URL
	let urlArray = req.body.url.split(/(?<!\/)\/(?!\/)/)
	//remove protocol to test with dns.lookup
	let url = urlArray[0].toString()
	let lookupUrl = url.startsWith("https") ? url.split("https://")[1] : url
	//retain full url to store in db
	let fullUrl = req.body.url
	//test url and commit to db if valid
	dns.lookup(lookupUrl, (err, address) =>
	{
		if (err)
		{
			console.log(err)
			res.json(
			{
				error: 'invalid url'
			})
		}
		else
		{

			const saveUrl = (done) =>
			{

				//count number of records in the db and add one to get a new unique ID
				let count = URL_MODEL.countDocuments(
				{}, (err, result) =>
				{
					if (err)
					{
						console.log(err);
					}
					else
					{
						numRecordsPlusOne = result + 1;
						//add protocol if missing
						if (!fullUrl.startsWith("https://") && !fullUrl.startsWith("http://"))
						{
							fullUrl = "https://" + fullUrl
						}
						//make new URL from input
						let urlToSave = new URL(fullUrl)

						let submit = new URL_MODEL(
						{
							url: urlToSave,
							short: numRecordsPlusOne
						})
						submit.save((err, data) =>
						{
							if (err) console.log(err);
							console.log(data);
							res.json(
							{
								original_url: urlToSave,
								short_url: numRecordsPlusOne
							})
						})



					}
				})



			}
			saveUrl()
		}
	})
})


//query the db and redirect to the new url

app.get('/api/shorturl/:query', (req, res, done) =>
{
	console.log(req.params.query)
	let query = req.params.query
	URL_MODEL.find(
	{
		short: query
	}, (err, data) =>
	{
		if (err) console.log(err);
		done(null, res.redirect(data[0].url));
	})
})

app.listen(port, function ()
{
	console.log(`Listening on port ${port}`);
});