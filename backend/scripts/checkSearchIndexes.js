import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set");
  process.exit(1);
}

const ATLAS_SEARCH_INDEXES = {
  universities: ["universities_search", "universities_autocomplete"],
  users: ["users_search", "users_autocomplete"],
  posts: ["posts_search"],
  notes: ["notes_search", "notes_autocomplete"],
  reviews: ["reviews_search"],
};

const TEXT_INDEXES = {
  universities: {
    fields: { name: "text", city: "text", state: "text", description: "text" },
    weights: { name: 10, city: 5, state: 5, description: 3 },
  },
  users: {
    fields: { username: "text", fullName: "text", bio: "text" },
    weights: { username: 10, fullName: 8, bio: 3 },
  },
  posts: {
    fields: { title: "text", content: "text", tags: "text" },
    weights: { title: 10, content: 5, tags: 7 },
  },
  notes: {
    fields: { title: "text", description: "text", subject: "text", course: "text", tags: "text" },
    weights: { title: 10, description: 5, subject: 8, course: 7, tags: 6 },
  },
  reviews: {
    fields: { title: "text", content: "text" },
    weights: { title: 8, content: 5 },
  },
};

const checkAtlasSearchIndex = async (db, collectionName, indexName) => {
  try {
    const result = await db.collection(collectionName).aggregate([
      { $search: { index: indexName, text: { query: "test", path: { wildcard: "*" } } } },
      { $limit: 1 },
    ]).toArray();
    return { available: true, error: null };
  } catch (error) {
    return { available: false, error: error.message };
  }
};

const checkTextIndex = async (db, collectionName) => {
  try {
    const indexes = await db.collection(collectionName).indexes();
    const textIndex = indexes.find((idx) => idx.textIndexVersion);
    return { available: !!textIndex, index: textIndex };
  } catch (error) {
    return { available: false, error: error.message };
  }
};

const createTextIndex = async (db, collectionName, config) => {
  try {
    await db.collection(collectionName).createIndex(config.fields, {
      weights: config.weights,
      name: `${collectionName}_text_search`,
    });
    return { success: true };
  } catch (error) {
    if (error.code === 85 || error.code === 86) {
      // Index already exists or conflicting index
      console.log(`  Note: Text index conflict on ${collectionName}, may need manual cleanup`);
      return { success: false, error: "Index conflict" };
    }
    return { success: false, error: error.message };
  }
};

const checkSearchIndexes = async () => {
  console.log("=".repeat(60));
  console.log("MongoDB Search Index Check");
  console.log("=".repeat(60));
  console.log();

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!\n");

    const db = mongoose.connection.db;
    const results = {
      atlasSearch: { available: false, indexes: {} },
      textSearch: { available: false, indexes: {} },
    };

    // Check Atlas Search indexes
    console.log("Checking Atlas Search indexes...");
    console.log("-".repeat(40));

    let atlasAvailable = false;
    for (const [collection, indexes] of Object.entries(ATLAS_SEARCH_INDEXES)) {
      results.atlasSearch.indexes[collection] = {};
      for (const indexName of indexes) {
        const check = await checkAtlasSearchIndex(db, collection, indexName);
        results.atlasSearch.indexes[collection][indexName] = check.available;
        if (check.available) {
          atlasAvailable = true;
          console.log(`  ✅ ${collection}.${indexName}`);
        } else {
          console.log(`  ❌ ${collection}.${indexName}`);
        }
      }
    }
    results.atlasSearch.available = atlasAvailable;

    console.log();
    console.log("Checking basic text indexes...");
    console.log("-".repeat(40));

    // Check and create text indexes if needed
    let textAvailable = true;
    for (const [collection, config] of Object.entries(TEXT_INDEXES)) {
      const check = await checkTextIndex(db, collection);
      results.textSearch.indexes[collection] = check.available;

      if (check.available) {
        console.log(`  ✅ ${collection} - text index exists`);
      } else {
        console.log(`  ⚠️  ${collection} - no text index, creating...`);
        const createResult = await createTextIndex(db, collection, config);
        if (createResult.success) {
          console.log(`     ✅ Created text index for ${collection}`);
          results.textSearch.indexes[collection] = true;
        } else {
          console.log(`     ❌ Failed: ${createResult.error}`);
          textAvailable = false;
        }
      }
    }
    results.textSearch.available = textAvailable;

    // Summary
    console.log();
    console.log("=".repeat(60));
    console.log("Summary");
    console.log("=".repeat(60));

    if (atlasAvailable) {
      console.log("\n🚀 Atlas Search: AVAILABLE");
      console.log("   The application will use Atlas Search for:");
      console.log("   - Fuzzy matching (typo tolerance)");
      console.log("   - Better relevance scoring");
      console.log("   - Autocomplete suggestions");
      console.log("   - Search highlighting");
    } else {
      console.log("\n⚠️  Atlas Search: NOT AVAILABLE");
      console.log("   To enable Atlas Search:");
      console.log("   1. Go to MongoDB Atlas dashboard");
      console.log("   2. Navigate to your cluster → Search");
      console.log("   3. Create indexes as documented in /docs/atlas-search-indexes.md");
    }

    if (textAvailable) {
      console.log("\n✅ Basic Text Search: AVAILABLE");
      console.log("   The application will fall back to basic text search if Atlas Search is unavailable");
    } else {
      console.log("\n❌ Basic Text Search: ISSUES DETECTED");
      console.log("   Run 'npm run db:indexes' to create missing indexes");
    }

    // Recommendation
    console.log();
    console.log("-".repeat(60));
    if (atlasAvailable) {
      console.log("Recommendation: Using Atlas Search (optimal)");
    } else if (textAvailable) {
      console.log("Recommendation: Using basic text search (functional)");
      console.log("Consider setting up Atlas Search for better search experience");
    } else {
      console.log("Recommendation: Run 'npm run db:indexes' to fix search indexes");
    }
    console.log("-".repeat(60));

    return results;
  } catch (error) {
    console.error("Error checking indexes:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
};

// Run the check
checkSearchIndexes();
