<!--
*** Source: Best-README-Template
*** https://github.com/othneildrew/Best-README-Template
-->



<!-- PROJECT LOGO -->
<br />
<p align="center">
  <h1 align="center">Karasu OS</h3>

  <p align="center">
    A website to track the cards you own in the mobile game Obey Me!
    <br />
  </p>
</p>



<!-- TABLE OF CONTENTS -->
## Table of Contents

* [About the Project](#about-the-project)
  * [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Usage](#usage)
* [License](#license)
* [Contact](#contact)
* [Acknowledgements](#acknowledgements)



<!-- ABOUT THE PROJECT -->
## About The Project

Obey Me! is a gacha game developed by NTT Solmare. It offers a wide variety of cards that can be gathered by the players. Karasu OS was created to make it easier to track the cards that you own and the ones that you still need to acquire. 

Here are its main features:
* Browse the full collection of cards with the ability to filter it by rarity, attribute, character or the card's name
* See how the bloomed version of the card looks like before unlocking it
* Add cards to your personal collection to see which ones you lack when the event returns
* Share your collection with others

Future features might include event calculator, resource tracker and others.

### Built With
* [Node.js](https://nodejs.org/en/)
* [Bootstrap](https://getbootstrap.com)
* [JQuery](https://jquery.com)
* [MongoDB](https://www.mongodb.com/)



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

* Node and npm

You can find information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).
If the installation was successful, you should be able to run the following commands.

```sh
node --version
v8.11.3
```

```sh
npm --version
6.1.0
```

* MongoDB

You can find installation instructions on the [official MongoDB website](https://www.mongodb.com/). You need to be able to run Mongo server to proceed.

### Installation

1. Clone the repo
```sh
git clone https://github.com/carnwyr/OM-collection.git
```
2. Install NPM packages
```sh
npm install
```
3. Create a new database in MongoDB
4. Create a `.env` file in the root directory. Create three variables there and set them
```JS
URI=connection_string_for_your_database
SECRET=random_string_used_for_hashing
SALT_ROUNDS=number_of_salt_rounds_used_for_hashing
```



<!-- USAGE EXAMPLES -->
## Usage

After installation run Mongo server in the bin directory of MongoDB's installation path
```sh
.\mongod
```
and node application in the project root directory
```sh
node start
```
After that the website should be available by the address http://localhost:3000/
To use the full functionality of the website you need to populate the cards collection in the database and place corresponding images in public/images/cards/S and public/images/cards/L. The folders are designated for preview images and full images respectively. The file names have to be the same as the cards' unique names with addition of _b for the bloomed versions.



<!-- LICENSE -->
## License

Distributed under the MIT License.



<!-- CONTACT -->
## Contact

Laele/carnwyr - carnwyr@gmail.com - carnwyr#6733 (Discord)

char - char#9463 (Discord)

Project Link: [https://github.com/carnwyr/OM-collection](https://github.com/carnwyr/OM-collection)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements
* [Obey Me! by NTT Solmare](https://shallwedate.jp/obeyme/en/)
* [Express.js](https://expressjs.com/)
* [Pug](https://pugjs.org/)
* [Mongoose](https://mongoosejs.com/)
* [Themestr](https://themestr.app/)
