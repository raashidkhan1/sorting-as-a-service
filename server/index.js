require('dotenv').config()

const {format} = require('util');
const express = require("express");
const {upload, bucket} = require("./apis/upload");
const multer = require("multer");
const cors = require("cors");
const connection = require("./apis/database")
const bodyParser = require('body-parser');
const generateUniqueId = require('./utils')


const app = express();

const chunkSize = 10

//Add the client URL to the CORS policy
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus:200,
};
app.use(cors(corsOptions));

app.post("/upload_file", upload.single("file"), function (req, res, next) {
  if (!req.file) {
    //If the file is not uploaded, then throw custom error with message: FILE_MISSING
    throw Error("FILE_MISSING");
  } else {
    // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
    console.log("File uploaded to GCS and accessible on: ", publicUrl)
    //If the file is uploaded, then send a success response.
    res.status(200).send(blob.name);
  });

  blobStream.end(req.file.buffer);


    //If the file is uploaded, then send a success response.
    // res.send({ status: "success" });
  }
});

// APIs for SQL queries
app.get("/get_job_details/:jobId", (req, res)=>{
  connection.query(      
    "SELECT * FROM jobs WHERE job_id = ?", req.params.jobId,
  function(error, results, fields) {
    if (error) throw error;
    res.json(results);
  }
);
})
// API for pub/sub
// API for downloading file

app.post("/create_job/:filename", (req, res)=>{
  const job_id = generateUniqueId();
  const file_name = req.params.filename;
  const processed = false;
  const completion_perc = 0;
  const chunks = 10 // divide file size in chunks
  values = [job_id, file_name, processed, completion_perc, chunks];
  sql_insert_query = "INSERT INTO jobs (job_id, filename, isProcessed, completion_perc, chunks) VALUES (?)"
  connection.query(sql_insert_query, [values], function(err, results, fields) {
      if (err) throw err;
      // return created job_id on successful table update
      res.json(job_id);
    }
  )
})

 
//Express Error Handling
app.use(function (err, req, res, next) {
  // Check if the error is thrown from multer
  if (err instanceof multer.MulterError) {
    res.statusCode = 400;
    res.send({ code: err.code });
  } else if (err) {
    // If it is not multer error then check if it is our custom error for FILE_MISSING & INVALID_TYPE
    if (err.message === "FILE_MISSING" || err.message === "INVALID_TYPE") {
      res.statusCode = 400;
      res.send({ code: err.message });
    } else {
      //For any other errors set code as GENERIC_ERROR
      res.statusCode = 500;
      res.send({ code: "GENERIC_ERROR" });
    }
  }
});

//Start the server in port 8081
const server = app.listen(8081, function () {
  const port = server.address().port;

  console.log("App started at http://localhost:%s", port);
  console.log('Press Ctrl+C to quit.');
});
