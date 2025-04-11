const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const predictPrice = (propertyType, sqft, city, bhk) => {
  return new Promise((resolve, reject) => {
    try {
      const workspacePath = path.join(__dirname, '../..');
      console.log('Current directory:', __dirname);
      console.log('Workspace path:', workspacePath);
      
      const dataPath = path.join(workspacePath, 'Makaan_Cleaned.csv');
      const pythonScriptPath = path.join(workspacePath, 'market.py');
      
      console.log('Constructed data path:', dataPath);
      console.log('Python script path:', pythonScriptPath);
      
      // Verify files exist
      if (!fs.existsSync(dataPath)) {
        console.error('Data file does not exist at:', dataPath);
        reject(new Error(`Data file not found at ${dataPath}`));
        return;
      }
      if (!fs.existsSync(pythonScriptPath)) {
        console.error('Python script does not exist at:', pythonScriptPath);
        reject(new Error(`Python script not found at ${pythonScriptPath}`));
        return;
      }

      const inputData = {
        propertyType,
        sqft,
        city,
        bhk,
        dataPath
      };

      console.log('Full input data being sent:', JSON.stringify(inputData, null, 2));

      // Spawn Python process with the correct working directory
      const pythonProcess = spawn('python', [pythonScriptPath, JSON.stringify(inputData)], {
        cwd: workspacePath  // Set working directory to workspace root
      });

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Python stdout:', output);
        result = output.trim().split('\n').pop();
      });

      pythonProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        console.error('Python stderr:', errorOutput);
        error += errorOutput;
      });

      pythonProcess.on('close', (code) => {
        console.log('Python process exited with code:', code);
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${error}`));
          return;
        }

        try {
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (e) {
          console.error('Error parsing Python output:', e);
          reject(new Error('Failed to parse Python output'));
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Error spawning Python process:', err);
        reject(new Error('Failed to start Python process'));
      });
    } catch (error) {
      console.error('Error in predictPrice:', error);
      reject(error);
    }
  });
};

module.exports = {
  predictPrice
}; 