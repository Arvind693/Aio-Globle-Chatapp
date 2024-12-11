const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const envFilePath = path.join(__dirname, '.env');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = require(packageJsonPath);
const serverHost = process.env.SERVER_HOST || 'localhost';
const newProxy = `http://${serverHost}:5000`;

function ensureEnvFileAndUpdate(envFilePath, key, value) {
  let envContent = '';

  if (!fs.existsSync(envFilePath)) {
    fs.writeFileSync(envFilePath, '', 'utf-8'); 
    console.log(`.env file created at ${envFilePath}`);
  } else {
    envContent = fs.readFileSync(envFilePath, 'utf-8');
  }

  const envLines = envContent.split('\n');
  let updated = false;
  const newEnvLines = envLines.map((line) => {
    const [envKey] = line.split('=');
    if (envKey === key) {
      updated = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!updated) {
    newEnvLines.push(`${key}=${value}`);
  }
  fs.writeFileSync(envFilePath, newEnvLines.join('\n'), 'utf-8'); 
  console.log(`Updated ${key} to: ${value} in ${envFilePath}`);
}

ensureEnvFileAndUpdate(envFilePath, 'REACT_APP_SERVER_HOST', serverHost);

if (packageJson.proxy !== newProxy) {
  packageJson.proxy = newProxy;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
  console.log(`Proxy updated to: ${newProxy}`);
}


