const fs = require('fs');
const os = require('os');

// Function to get the local IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // return iface.address;
        return 'localhost'
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIp();

const envFilePath = '.env';

// Check if the .env file exists
if (!fs.existsSync(envFilePath)) {
  console.error('Error: .env file not found!');
  process.exit(1);
}

// Read the .env file
const envContent = fs.readFileSync(envFilePath, 'utf-8');

// Update the IP address for REACT_APP_CLIENT_URL and SERVER_HOST
const updatedEnvContent = envContent
  .split('\n')
  .map((line) => {
    if (line.startsWith('REACT_APP_CLIENT_URL=')) {
      return `REACT_APP_CLIENT_URL=http://${ip}:3000`;
    } else if (line.startsWith('SERVER_HOST=')) {
      return `SERVER_HOST=${ip}`;
    }
    return line; // Preserve other lines
  })
  .join('\n');

// Write the updated content back to the .env file
fs.writeFileSync(envFilePath, updatedEnvContent);

console.log('IP addresses in .env updated successfully!');
