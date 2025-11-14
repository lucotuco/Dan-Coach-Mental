// Import Mongoose:
const mongoose = require("mongoose");

// Import data model for user objects:
const User = require("../models/userModel");

// get all users:
const getAllUsers = async (req, res) => {
  // use .find() method on User data schema to fetch all user objects:
  // leave obj in .find() blank, as all users are being fetched
  const allUsers = await User.find({});

  /* Set HTTP status to 200 (ok) & convert response to JSON. The result is
  an object in JSON that contains info on all users */
  res.status(200).json(allUsers);
};

/* get a single user by their id (unique property added to each user object
   upon its creation in MongoDB */
const getUser = async (req, res) => {
  // Get id from request parameters:
  const { id } = req.params;

  /* If id is not a valid MongoDB ObjectId, set HTTP status to 400 (bad 
     request) and return error message in JSON form */
  if (!mongoose.Types.ObjectId.isValid(id)) {
     return res.status(400).json({ error: "Bad request (invalid id)" });
  }

  /* assign user to document in DB that has id that matches the 
     id defined in this method: */
  const user = await User.findById(id);

  /* If no user id in database matches id from the request parameter,
     set HTTP status to 404 and return error message in JSON form */
  if (!user) {
    return res.status(404).json({ error: "User doesn't exist" });
  }

  /* If a user object (document) has an id that matches id in the 
     request parameters, set HTTP status to 200 & return that user object in
     JSON format */
  res.status(200).json(user);
};

// create new user
const createNewUser = async (req, res) => {
  // Destructure all user-object properties from request body:
  const {
    firstName,
    lastName,
    password,
    city,
    stateProvince,
    country,
    phoneCountry,
    phoneCountryCode,
    phoneCountryWithoutCountryCode,
    instagram,
    facebook,
    x,
    interests,
    about,
    friendRequestsReceived,
    friendRequestsSent,
    hostingCredits,
    profileImage,
    profileVisibleTo,
    subscriptionType,
    whoCanAddUserAsOrganizer,
    whoCanInviteUser,
    username,
    friends,
    emailAddress,
  } = req.body;

  // Try creating new user document in users collection in DB
  /* If successful, set HTTP status to 200 & return the newly created user
     document in JSON format. If it fails, set HTTP status to 400 
     (bad request) & return error message in JSON format. */
  try {
    const user = await User.create({
      firstName,
      lastName,
      password,
      city,
      stateProvince,
      country,
      phoneCountry,
      phoneCountryCode,
      phoneCountryWithoutCountryCode,
      instagram,
      facebook,
      x,
      interests,
      about,
      friendRequestsReceived,
      friendRequestsSent,
      hostingCredits,
      profileImage,
      profileVisibleTo,
      subscriptionType,
      whoCanAddUserAsOrganizer,
      whoCanInviteUser,
      username,
      friends,
      emailAddress,
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a user:
const deleteUser = async (req, res) => {
  // Get user document from request parameters by its id:
  const { id } = req.params;

  /* If id is not a valid MongoDB ObjectId, set HTTP status to 400 (bad 
     request) and return error message in JSON form */
  if (!mongoose.Types.ObjectId.isValid(id)) {
     return res.status(400).json({ error: "Bad request (invalid id)" });
  }

  /* Use the findOneAndDelete() method to delete user document with
     id that matches id in request parameters */
  const user = await User.findOneAndDelete({ _id: id });

  /* If no user id in database matches id from the request parameter,
     set HTTP status to 404 and return error message in JSON form */
  if (!user) {
    return res.status(404).json({ error: "User doesn't exist" });
  }

  /* If a user object (document) has an id that matches id in the 
     request parameters, set HTTP status to 200 & return that user object in
     JSON format. The user document will no longer exist in the DB. */
  res.status(200).json(user);
};

// Update a user document:
const updateUser = async (req, res) => {
  // Get user document from request parameters by its id:
  const { id } = req.params;

  /* If id is not a valid MongoDB ObjectId, set HTTP status to 400 (bad 
     request) and return error message in JSON form */
  if (!mongoose.Types.ObjectId.isValid(id)) {
     return res.status(400).json({ error: "Bad request (invalid id)" });
  }

  /* Use the .findOneAndUpdate() method to get a particular user document,
     then update its values. */
  /* 2nd argument in .findOneAndUpdate() is an object containing the 
     properties to be updated, along with their updated values */
  /* 3rd argument will return the updated user object after a 
     successful request */
  const user = await User.findOneAndUpdate({ _id: id }, { ...req.body }, 
    { new: true });

  /* If no user id in database matches id from the request parameter,
     set HTTP status to 404 and return error message in JSON form */
  if (!user) {
    return res.status(404).json({ error: "User doesn't exist" });
  }

  /* If a user object (document) has an id that matches id in the 
     request parameters, set HTTP status to 200 & return that user object in
     JSON format. The updated version of the user document 
     will now be in the place of the old version in the DB. */
  res.status(200).json(user);
};

// Export the controllers:
module.exports = {
  createNewUser,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
};