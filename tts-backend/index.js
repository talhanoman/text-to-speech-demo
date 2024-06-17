const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const dotenv = require('dotenv');
dotenv.config();
const app = express();
const port = 3000;
const SERVER_URL = `http://192.168.18.57:${port}`;

// Configure AWS Polly with your credentials
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});
const polly = new AWS.Polly();

app.use(bodyParser.json());

app.post('/convert', (req, res) => {
    const audioDirPath = path.join(__dirname, 'audio');
    fs.rm(audioDirPath, { recursive: true, force: true }, err => {
        if (err) {
            throw err;
        }
        const text = req.body.text;
        console.log('Text', text);
        const params = {
            OutputFormat: 'mp3',
            Text: text,
            VoiceId: 'Joanna',
        };
    
        polly.synthesizeSpeech(params, (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            } else {
                const audioFileName = `${uuidv4()}.mp3`;
                const audioDir = path.join(__dirname, 'audio');         
                // Check if audio directory exists
                if (!fs.existsSync(audioDir)) {
                    fs.mkdirSync(audioDir, { recursive: true }); 
                } 
    
                const audioFilePath = path.join(audioDir, audioFileName);            
                fs.writeFile(audioFilePath, data.AudioStream, (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send(err);
                    } else {
                        res.json({ audioUrl: `${SERVER_URL}/audio/${audioFileName}` });
                    }
                });
            }
        });
    });
});


app.use(cors());
// Serve static audio files from the audio directory
app.use('/audio', express.static(path.join(__dirname, 'audio')));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
