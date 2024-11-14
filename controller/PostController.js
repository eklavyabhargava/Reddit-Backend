const bucket = require("../firebase-storage");
const Post = require("../models/Post");
const { ObjectId } = require("mongoose");

module.exports = {
  // Handle new post
  async createPost(req, res) {
    const { title, description } = req.body;
    const { file } = req;

    try {
      if (!title) {
        return res
          .status(400)
          .json({ isSuccess: false, errMsg: "Required field is missing" });
      }

      let post = new Post({
        title,
        description,
        createdBy: req.user._id,
      });

      if (file) {
        const fileName = `posts/${req.user._id}/${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const metadata = {
          contentType: file.mimetype, // Simplified metadata structure
        };

        // upload the file
        fileUpload.save(file.buffer, metadata, async (err) => {
          if (err) {
            console.log(err);
            return res
              .status(500)
              .json({ isSuccess: false, errMsg: "Error uploading file" });
          }

          try {
            const [url] = await fileUpload.getSignedUrl({
              action: "read",
              expires: "2500-01-30",
            });
            post.imageUrl = url;

            await post.save();
            res.status(201).json({
              isSuccess: true,
              msg: "Post created successfully",
              post,
            });
          } catch (error) {
            console.log(error);
            return res
              .status(500)
              .json({ isSuccess: false, errMsg: "Error saving tweet" });
          }
        });
      } else {
        await post.save();
        res.status(201).json({
          isSuccess: true,
          msg: "{Post created successfully",
          post,
        });
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ isSuccess: false, errMsg: "Internal Server Error" });
    }
  },

  // Fetch all posts
  async getPosts(req, res) {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = 10; // Number of posts per page

    try {
      const totalPosts = await Post.countDocuments(); // Count total posts for pagination
      const posts = await Post.find()
        .populate("createdBy", "username")
        .populate({
          path: "votes.user",
          select: "username",
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit) // Skip posts based on the page number
        .limit(limit); // Limit the number of posts per page

      return res.status(200).send({
        isSuccess: true,
        posts: posts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts: totalPosts,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .send({ isSuccess: false, errMsg: "Internal Server Error" });
    }
  },

  // Handle votes
  async castVote(req, res) {
    const { postId, voteType } = req.body;
    const { _id: userId } = req.session.user;

    if (!postId || !voteType) {
      return res
        .status(400)
        .send({ isSuccess: false, errMsg: "Required field missing." });
    }

    try {
      let post = await Post.findById(postId);
      if (!post) {
        return res
          .status(404)
          .json({ isSuccess: false, errMsg: "Post Not Found" });
      }

      const voteIndex = post.votes.findIndex(
        (vote) => vote.user.toString() === userId
      );

      if (voteIndex !== -1) {
        if (post.votes[voteIndex].voteType === voteType) {
          post.votes.splice(voteIndex, 1);
        } else {
          post.votes[voteIndex].voteType = voteType;
        }
      } else {
        post.votes.push({ user: userId, voteType });
      }

      await post.save();

      post = await Post.findById(postId).populate({
        path: "votes.user",
        select: "username",
      });

      return res.status(201).send({ isSuccess: true, post });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send({ isSuccess: false, errMsg: "Internal Server Error" });
    }
  },
};
