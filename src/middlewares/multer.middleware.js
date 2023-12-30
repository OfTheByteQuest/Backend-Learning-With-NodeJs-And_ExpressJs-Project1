import multer from "multer";
import { PATH_TO_STAT_FILES } from "../constants.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PATH_TO_STAT_FILES);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});
