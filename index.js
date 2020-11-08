const express = require('express')
const http = require('http')
const bodyParser = require('body-parser')

const { MongoClient, ObjectId } = require('mongodb')

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const nativeClient = new MongoClient(
  'mongodb://localhost:27017/benchmark',
  {useNewUrlParser: true, useUnifiedTopology: true, poolSize: 1})

const nativeApp = express()

nativeApp.set('port', 3001)
nativeApp.use(bodyParser.json())

nativeApp.use((req, res, next) => {
  req.db = {}
  req.db.native= nativeApp.get('db').collection('native')
  next()
})

nativeApp.get('/', (req, res) => {
  req.db.native.find({}).toArray((e, results) => res.send(results))
})

nativeApp.post('/', async (req, res) => {
  const data = await req.db.native.insertOne({
    number: req.body.number,
    lastUpdated: new Date()
  })
  res.set('Location', '/' + data.ops[0]._id)
  res.status(201).send(data.ops[0])
})

nativeApp.get('/:id', async (req, res) => {
  const entry = await req.db.native.findOne({_id: new ObjectId(req.params.id)})
  res.send(entry)
})

nativeApp.put('/:id', async (req, res) => {
  const { number } = req.body
  const data = await req.db.native.findOneAndUpdate(
    {_id: new ObjectId(req.params.id)},
    {$set: {number: number}, $currentDate: {lastUpdated: true}},
    {returnOriginal: false})
  res.send(data.value)
})

const mongooseConn = mongoose.createConnection(
  'mongodb://localhost:27017/benchmark',
  {useNewUrlParser: true, useUnifiedTopology: true, poolSize: 1})
mongooseConn.once('open', () => console.log('Connected to mongoose database'))

const mongooseApp = express()

mongooseApp.set('port', 3002)
mongooseApp.use(bodyParser.json())

mongooseApp.use((req, res, next) => {
  req.db = {mongoose: mongooseConn.model(
    'Mongoose',
    new Schema({number: Number, lastUpdated: Date}),
    'mongoose')}
  next()
})

mongooseApp.get('/', async (req, res) => {
  res.send(await req.db.mongoose.find())
})

mongooseApp.post('/', async (req, res) => {
  const data = await req.db.mongoose.create({
    number: req.body.number,
    lastUpdated: new Date()
  })
  res.set('Location', '/' + data.id)
  res.status(201).send(data)
})

mongooseApp.get('/:id', async (req, res) => {
  const entry = await req.db.mongoose.findById(req.params.id).lean()
  res.send(entry)
})

mongooseApp.put('/:id', async (req, res) => {
  const { number } = req.body
  const data = await req.db.mongoose.findById(req.params.id)
  data.number = number
  data.lastUpdated = new Date()
  res.send(await data.save())
})

const nativeServer = http
  .createServer(nativeApp)
  .listen(nativeApp.get('port'), async () => {
    console.log('Native server listening on port ' + nativeApp.get('port'))
    await nativeClient.connect()
    console.log('Connected to native database')
    nativeApp.set('db', nativeClient.db('benchmark'))
  })

http
  .createServer(mongooseApp)
  .listen(
    mongooseApp.get('port'),
    () => console.log('Mongoose listening on port ' + mongooseApp.get('port')))

Object.getOwnPropertyNames(['SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM'])
  .forEach((eventType) => {
    process.on(eventType, async () => {
      console.log('Closing database connection')
      await nativeClient.close()
      nativeServer.close()
    })
  })
