const User = require("../modals/ChatUser");
const Friends = require("../modals/Friends");

// Pending: We have to optimise this so that it will find the pattern not compare them
const searchFriend = (req, res) => {
  const { query } = req.body;
  User.find({ $or: [{ name: query }, { email: query }] })
    .select("name _id email")
    .then((users) => {
      console.log(users);
      res.status(200).json({ success: true, users });
    })
    .catch((err) =>
      res.status(500).json({ success: false, message: err.message })
    );
};

// API: That will create the Friend
const addFriend = async (req, res) => {
  const { friendid } = req.params;

  // 1. check if user with this friendid exist or not
  try {
    const friend = await User.findById(friendid);

    // check if loggedin user nad friend id same
    if (req.user._id == friendid)
      return res.status(400).json({
        success: false,
        message: "You cannot send request to yourself",
      });

    if (!friend) {
      return res
        .status(400)
        .json({ success: false, message: "No user Found by this Id" });
    }

    // generating the unique id by combinng both the user ids
    let connectionId;
    if (req.user._id > friendid) connectionId = req.user._id + friendid;
    else connectionId = friendid + req.user._id;

    const alreadyInConnection = await Friends.findOne({
      connectionId: connectionId,
      $or: [{ status: "Pending" }, { status: "Accepted" }],
    });

    // 2. Check if Both are already friends ( Complex Query )
    // const alreadyInConnection = await Friends.findOne({
    //   $or: [{ status: "Pending" }, { status: "Accepted" }],
    //   $or: [
    //     {
    //       sender: req.user._id,
    //       receiver: friendid,
    //     },
    //     {
    //       sender: friendid,
    //       receiver: req.user._id,
    //     },
    //   ],
    // });

    if (alreadyInConnection)
      return res
        .status(400)
        .json({ success: false, message: "Already in Friends" });

    // 2. Add the the user with friendid in the friendlist ( Generating Uniqu Key)

    await Friends.create({
      sender: req.user._id,
      receiver: friendid,
      connectionId: connectionId,
    });

    return res
      .status(200)
      .json({ success: true, message: "Friend Request Sent" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// API : This will return you all your friends Who are Connected or Pending
const giveConnectedFriends = async (req, res) => {
  try {
    const friends = await Friends.find({
      status: "Accepted",
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    }).populate("sender receiver");
    return res.status(200).json({ success: true, friends });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const fetchPendingRequest = async (req, res) => {
  try {
    const friends = await Friends.find({
      status: "Pending",
      receiver: req.user._id,
    }).populate("sender");

    return res.status(200).json({ success: true, friends });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// accept request
const accpetFriendRequest = async (req, res) => {
  try {
    const { docid } = req.params;

    const result = await Friends.findOneAndUpdate(
      { _id: docid, receiver: req.user._id },
      { status: "Accepted" }
    );

    if (!result) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Request" });
    }
    return res.status(200).json({ success: true, message: "Request Accepted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const rejectFriendRequest = async (req, res) => {
  const { docid } = req.params;

  const result = await Friends.findOneAndUpdate(
    { _id: docid, receiver: req.user._id },
    { status: "Rejected" }
  );

  if (!result) {
    return res.status(400).json({ success: false, message: "Invalid Request" });
  }
  return res.status(200).json({ success: true, message: "Request Accepted" });
};

module.exports = {
  searchFriend,
  addFriend,
  giveConnectedFriends,
  fetchPendingRequest,
  accpetFriendRequest,
  rejectFriendRequest,
};

// Umesh
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTI5NmZhMGJmY2U3OTExZmI5YjI3NzUiLCJuYW1lIjoiVW1lc2giLCJpYXQiOjE2OTcyMTQ0MDZ9.yK96bDhXVdas88femeHyvhLVBPuWQsf5y5fX72MaFJc

// Umesh -> Ashish

// Ashih Kumar
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTI0MzBkMDdhODhiYjEzNWZkNWJmYjMiLCJuYW1lIjoiQXNoaXNoIEt1bWFyIiwiaWF0IjoxNjk3MjE2MzI1fQ.vSidwzKFNV_riTyINNPA8yeB0ZiGr7yP_Saa1mIL91M
