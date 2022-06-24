require('dotenv').config({path: '../'})

const {PubSub} = require('@google-cloud/pubsub');
// const {PUBSUB_API_ENDPOINT} = require('../constants');

// The following environment variables are set by app.yaml when running on GAE,
// but will need to be manually set when running locally.
// const {PUBSUB_VERIFICATION_TOKEN} = process.env;
const TOPIC_SORT = process.env.PUBSUB_TOPIC_SORT;
const TOPIC_PALINDROME = process.env.PUBSUB_TOPIC_PALINDROME;
const SUB_PALINDROME_RESULT = process.env.PUBSUB_SUB_PALINDROME_RESULT;
const SUB_SORT_RESULT = process.env.PUBSUB_SUB_SORT_RESULT;
const timeout = 5; //5 s

const pubsub = new PubSub({
    projectId: process.env.GOOGLE_CLOUD_PROJECT
    // keyFilename: process.env.PUBSUB_SERVICE_ACCOUNT //for local run
});

const sort_topic_pubsub = pubsub.topic(TOPIC_SORT);
const palind_topic_pubsub = pubsub.topic(TOPIC_PALINDROME);

async function publishtoPubSub(chunks, filename) {
    chunks.forEach(async (chunk, index)=>{
        let publishData = {
            filename: filename, 
            startByte: chunk.startByte, 
            endByte: chunk.endByte
        };
        // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
        
        if (index === chunks.length - 1 ){
            publishData.lastChunk = true;
        }

        let message = {
            data: Buffer.from(JSON.stringify(publishData))
        };
        try {
            // Publishes the message
            let sort_message_id = await sort_topic_pubsub.publishMessage(message);
            // let palind_message_id = await palind_topic_pubsub.publishMessage(message);
            console.log("Message published", sort_message_id);
        } catch (error) {
            console.error(`Received error while publishing: ${error.message}`);   
        }
    });
}

function listenForPalindromeMessages(res) {
    // References an existing subscription
    const subscription = pubsub.subscription(SUB_PALINDROME_RESULT);
  
    // Create an event handler to handle messages
    let messageCount = 0;
    const messageHandler = message => {
      console.log(`Received message ${message.id}:`);
      console.log(`\tData: ${message.data}`);
      console.log(`\tAttributes: ${message.attributes}`);
      messageCount += 1;
  
      // "Ack" (acknowledge receipt of) the message
      message.ack();
      res.status(200).json(message.data);
    };
  
    // Listen for new messages until timeout is hit
    subscription.on('message', messageHandler);
  
    setTimeout(() => {
      subscription.removeListener('message', messageHandler);
      console.log(`${messageCount} message(s) received.`);
    }, timeout * 1000);
}

function listenForSortingMessages(res) {
    // References an existing subscription
    const subscription = pubsub.subscription(SUB_SORT_RESULT);
  
    // Create an event handler to handle messages
    let messageCount = 0;
    const messageHandler = message => {
      console.log(`Received message ${message.id}:`);
      console.log(`\tData: ${message.data}`);
      console.log(`\tAttributes: ${message.attributes}`);
      messageCount += 1;
  
      // "Ack" (acknowledge receipt of) the message
      message.ack();
      res.status(200).json(message.data);
    };
  
    // Listen for new messages until timeout is hit
    subscription.on('message', messageHandler);
  
    setTimeout(() => {
      subscription.removeListener('message', messageHandler);
      console.log(`${messageCount} message(s) received.`);
    }, timeout * 1000);
}

module.exports = {
    publishtoPubSub,
    listenForPalindromeMessages,
    listenForSortingMessages
}
