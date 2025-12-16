import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set");
  process.exit(1);
}

const createIndexes = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // Universities indexes
    console.log("Creating Universities indexes...");
    try {
      await db.collection("universities").dropIndex("name_text_city_text_state_text_description_text");
    } catch (e) {
      // Index doesn't exist
    }
    await db.collection("universities").createIndex(
      { name: "text", city: "text", state: "text", description: "text" },
      { weights: { name: 10, city: 5, state: 5, description: 3 }, name: "universities_text_search" }
    );
    await db.collection("universities").createIndex({ domains: 1 }, { name: "universities_domains" });
    await db.collection("universities").createIndex({ country: 1, state: 1 }, { name: "universities_country_state" });
    await db.collection("universities").createIndex({ averageRating: -1 }, { name: "universities_rating" });
    console.log("  - Text index on name, city, state, description");
    console.log("  - Index on domains");
    console.log("  - Compound index on country, state");
    console.log("  - Index on averageRating (desc)");

    // Users indexes
    console.log("\nCreating Users indexes...");
    try {
      await db.collection("users").dropIndex("username_text_fullName_text_bio_text");
    } catch (e) {
      // Index doesn't exist
    }
    await db.collection("users").createIndex(
      { username: "text", fullName: "text", bio: "text" },
      { weights: { username: 10, fullName: 8, bio: 3 }, name: "users_text_search" }
    );
    await db.collection("users").createIndex({ university: 1 }, { name: "users_university" });
    await db.collection("users").createIndex({ createdAt: -1 }, { name: "users_created" });
    console.log("  - Text index on username, fullName, bio");
    console.log("  - Index on university");
    console.log("  - Index on createdAt (desc)");

    // Posts indexes
    console.log("\nCreating Posts indexes...");
    try {
      await db.collection("posts").dropIndex("title_text_content_text_tags_text");
    } catch (e) {
      // Index doesn't exist
    }
    await db.collection("posts").createIndex(
      { title: "text", content: "text", tags: "text" },
      { weights: { title: 10, content: 5, tags: 7 }, name: "posts_text_search" }
    );
    await db.collection("posts").createIndex({ category: 1 }, { name: "posts_category" });
    await db.collection("posts").createIndex({ university: 1 }, { name: "posts_university" });
    await db.collection("posts").createIndex({ category: 1, createdAt: -1 }, { name: "posts_category_created" });
    await db.collection("posts").createIndex({ parentPost: 1 }, { name: "posts_parent" });
    console.log("  - Text index on title, content, tags");
    console.log("  - Index on category");
    console.log("  - Index on university");
    console.log("  - Compound index on category, createdAt");
    console.log("  - Index on parentPost");

    // Notes indexes
    console.log("\nCreating Notes indexes...");
    try {
      await db.collection("notes").dropIndex("title_text_description_text_subject_text_course_text_tags_text");
    } catch (e) {
      // Index doesn't exist
    }
    await db.collection("notes").createIndex(
      { title: "text", description: "text", subject: "text", course: "text", tags: "text" },
      { weights: { title: 10, description: 5, subject: 8, course: 7, tags: 6 }, name: "notes_text_search" }
    );
    await db.collection("notes").createIndex({ university: 1 }, { name: "notes_university" });
    await db.collection("notes").createIndex({ subject: 1 }, { name: "notes_subject" });
    await db.collection("notes").createIndex({ downloadCount: -1 }, { name: "notes_downloads" });
    console.log("  - Text index on title, description, subject, course, tags");
    console.log("  - Index on university");
    console.log("  - Index on subject");
    console.log("  - Index on downloadCount (desc)");

    // Reviews indexes
    console.log("\nCreating Reviews indexes...");
    try {
      await db.collection("reviews").dropIndex("title_text_content_text");
    } catch (e) {
      // Index doesn't exist
    }
    await db.collection("reviews").createIndex(
      { title: "text", content: "text" },
      { weights: { title: 8, content: 5 }, name: "reviews_text_search" }
    );
    await db.collection("reviews").createIndex({ university: 1 }, { name: "reviews_university" });
    await db.collection("reviews").createIndex({ overallRating: -1 }, { name: "reviews_rating" });
    await db.collection("reviews").createIndex({ createdAt: -1 }, { name: "reviews_created" });
    console.log("  - Text index on title, content");
    console.log("  - Index on university");
    console.log("  - Index on overallRating (desc)");
    console.log("  - Index on createdAt (desc)");

    // SearchHistory indexes
    console.log("\nCreating SearchHistory indexes...");
    await db.collection("searchhistories").createIndex({ user: 1, query: 1 }, { unique: true, name: "searchhistory_user_query" });
    await db.collection("searchhistories").createIndex({ user: 1, updatedAt: -1 }, { name: "searchhistory_user_updated" });
    await db.collection("searchhistories").createIndex({ query: 1, count: -1 }, { name: "searchhistory_popular" });
    console.log("  - Compound unique index on user, query");
    console.log("  - Compound index on user, updatedAt");
    console.log("  - Compound index on query, count");

    console.log("\n✅ All indexes created successfully!");

    // List all indexes
    console.log("\n--- Index Summary ---\n");
    const collections = ["universities", "users", "posts", "notes", "reviews", "searchhistories"];
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      console.log(`${collName}: ${indexes.length} indexes`);
      indexes.forEach((idx) => {
        if (idx.name !== "_id_") {
          console.log(`  - ${idx.name}`);
        }
      });
    }
  } catch (error) {
    console.error("Error creating indexes:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
};

createIndexes();
