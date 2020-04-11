import express from "express";
import flash from "express-flash";
const router = express.Router();

router.use(flash());
router.use(async (req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  next();
});

router.get("/", (req, res, next) => {
  res.send("hello world");
});

router.get("/user/dashboard", (req, res, next) => {});

export default router;
