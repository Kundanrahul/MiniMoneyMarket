const fs = require('fs');
const path = require('path');

// Add all contracts you need ABIs for
const contracts = ['CollateralToken'];

contracts.forEach(contract => {
  const filePath = path.join('out', `${contract}.sol`, `${contract}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const json = JSON.parse(fs.readFileSync(filePath));
  const abi = json.abi;

  const outputDir = path.join('frontend', 'src', 'abis');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, `${contract}.json`),
    JSON.stringify(abi, null, 2) // pretty print with 2 spaces
  );

  console.log(`${contract} ABI saved to frontend/src/abis/${contract}.json`);
});
