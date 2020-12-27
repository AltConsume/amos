# @takeamos/deck

## Installation

```
git clone git@github.com:takeamos/deck.git
cd deck
npm install
```

## Usage

### config.json

`config.json` is how you configure what services are ran, how often and with what authentication. Additionally, `config.json` is used to configure your storage method (currently only file system)

```json
{
  "serviceConfigs": [
    {
      "name": "twitter",
      "url": "https://my-url.com",
      "pullSeconds": 10,
      "authentication": <base64 string of `${accessToken}:${accessTokenSecret}`
    },
    {
      "name": "youtube",
      "scope": "likes",
      "url": "https://my-url.com",
      "pullSeconds": 10,
      "authentication": <base64 string of `${accessToken}:${refreshToken}`
    }
  ],
  "storage": {
    "path": <absolute path>
  }
}
```

### Starting

`npm start`

## Wishlist

- mongo storage
- ipfs
- hypercore / hyperdrive
