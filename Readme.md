# Backend Learning

This project depicts the learning of backend development with `node.js` and `express.js`. The project is of a website that can be considered a clone of fusion of **Twitter** and **YouTube**. Production level file structure has been used to build the application. It token based authentication and authorization mechanism. 

## Funtioanlities of the backend

Following are the operations that this backend can handle:

- authentication and authorzation
- storing and selectively fetching user's crendiatls such as name, password, avatar image, cover image, etc.
- stroing and selectinvely fetching videos along with their thumbnail
- allowing to store and fetch comments, tweets and likes
- storing subscription details of the user to channels
- all the `CRUD` operations are used

Along with the all this, `MongoDB aggregation pipelines` have been used to complicated fecthing of information.


## Important Links

Following links contains infromation about the database models and Postoman collection for API's.

- [Model link](https://app.eraser.io/workspace/NFrpaiJlSMDtCEKzUpZx?origin=share): Link to all the database models used in the project.

- [Postman Link](https://www.postman.com/research-cosmologist-27616395/workspace/public-workspace-by-mali/collection/26858721-8c46e6a9-a1e9-4a3c-9d66-2fc11b11dcd2?action=share&source=copy-link&creator=26858721): Link to Postman colllection of all api routes uses

## Services used

ALog with the use of ***MognoDB Atlas*** for storing information and indexing, for this Project I have used ***Cloudinary*** as the cloud storage for images and videos files.


## Libraries and Tech used

- For file uplaodin to local serve `Multer` has been used.
- For authentication and authorization `JWT` has been used.
- For encryption and decryption of sensitive information such has passwords `Bcrypt` has been used.
- `Mongoose` has been used as **ODM** for handling `MogoDB` which is used as the primary database.

## Additional files

The repository also contains some additional files such as **erros.txt** and **Project sequential setup** files to store some extra information about the project.

- [errors.txt](./errors.txt):- contains some basic text messages which are frequently used in the project though, they are mandatorly utlized.
- [Project sequential setup](./Project%20sequential%20setup.excalidraw):- is an exacalidraw file that represents the itnital project setup of a ususal backend project. Although it is not complete it might be in the future.
- [About event loop, Promises, fetch and setTimeouts](./About%20event%20loop,%20Promises,%20fetch%20and%20setTimeouts.excalidraw):- have information about the asynchronous nature of the `Javascript` language and how it handles browers **Api(s)**
and promises. This file is the result of my habit of deeping my information stack while being confused. It certainly is a help for those who would truly like to deepen their understanding about the topics mentioned in the name of the file. Feel free to use as it contains examples and results.
