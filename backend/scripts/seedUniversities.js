import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// US state codes for region mapping
const REGIONS = {
  northeast: ["CT", "ME", "MA", "NH", "RI", "VT", "NJ", "NY", "PA"],
  midwest: ["IL", "IN", "MI", "OH", "WI", "IA", "KS", "MN", "MO", "NE", "ND", "SD"],
  south: ["DE", "FL", "GA", "MD", "NC", "SC", "VA", "DC", "WV", "AL", "KY", "MS", "TN", "AR", "LA", "OK", "TX"],
  west: ["AZ", "CO", "ID", "MT", "NV", "NM", "UT", "WY", "AK", "CA", "HI", "OR", "WA"],
};

function getRegion(state) {
  for (const [region, states] of Object.entries(REGIONS)) {
    if (states.includes(state)) return region;
  }
  return "";
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    usOnly: args.includes("--us-only"),
    hipoOnly: args.includes("--hipo-only"),
    limit: null,
  };

  const limitArg = args.find((a) => a.startsWith("--limit="));
  if (limitArg) {
    options.limit = parseInt(limitArg.split("=")[1], 10);
  }

  return options;
}

// Fetch from Hipo Universities API
async function fetchHipoUniversities(country = null) {
  const baseUrl = "http://universities.hipolabs.com/search";
  const url = country ? `${baseUrl}?country=${encodeURIComponent(country)}` : baseUrl;

  console.log(`Fetching from Hipo API${country ? ` (${country})` : ""}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Hipo API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`  Found ${data.length} universities`);
  return data;
}

// Fetch from College Scorecard API with pagination
async function fetchScorecardUniversities(apiKey, limit = null) {
  const baseUrl = "https://api.data.gov/ed/collegescorecard/v1/schools";
  const perPage = 100;
  const fields = [
    "id",
    "school.name",
    "school.city",
    "school.state",
    "school.zip",
    "school.school_url",
    "school.price_calculator_url",
    "school.ownership",
    "school.locale",
    "school.carnegie_size_setting",
    "location.lat",
    "location.lon",
    "latest.student.size",
    "latest.admissions.admission_rate.overall",
    "latest.completion.rate_suppressed.overall",
    "latest.admissions.sat_scores.average.overall",
    "latest.admissions.sat_scores.25th_percentile.critical_reading",
    "latest.admissions.sat_scores.75th_percentile.critical_reading",
    "latest.admissions.sat_scores.25th_percentile.math",
    "latest.admissions.sat_scores.75th_percentile.math",
    "latest.admissions.act_scores.midpoint.cumulative",
    "latest.admissions.act_scores.25th_percentile.cumulative",
    "latest.admissions.act_scores.75th_percentile.cumulative",
    "latest.cost.tuition.in_state",
    "latest.cost.tuition.out_of_state",
    "latest.cost.roomboard.oncampus",
    "latest.cost.booksupply",
    "latest.cost.avg_net_price.overall",
    "latest.aid.median_debt.completers.overall",
    "latest.aid.pell_grant_rate",
    "latest.earnings.6_yrs_after_entry.median",
    "latest.earnings.10_yrs_after_entry.median",
    "latest.student.retention_rate.overall.full_time",
    "latest.student.demographics.men",
    "latest.student.demographics.women",
    "latest.repayment.3_yr_default_rate",
  ].join(",");

  let allSchools = [];
  let page = 0;
  let hasMore = true;

  console.log("Fetching from College Scorecard API...");

  while (hasMore) {
    const url = `${baseUrl}?api_key=${apiKey}&fields=${fields}&per_page=${perPage}&page=${page}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Scorecard API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];
    allSchools = allSchools.concat(results);

    const total = data.metadata?.total || 0;
    const fetched = allSchools.length;
    process.stdout.write(`\r  Fetched ${fetched}/${total} schools...`);

    if (limit && fetched >= limit) {
      allSchools = allSchools.slice(0, limit);
      hasMore = false;
    } else if (results.length < perPage || fetched >= total) {
      hasMore = false;
    } else {
      page++;
    }
  }

  console.log(`\n  Total: ${allSchools.length} US schools`);
  return allSchools;
}

// Transform Hipo data to University schema
function transformHipoData(school) {
  const domains = school.domains || [];
  const webPages = school.web_pages || [];
  const country = school.country || "";
  const isUS = country === "United States";

  return {
    name: school.name,
    country: country,
    state: school["state-province"] || "",
    city: "",
    website: webPages[0] || "",
    emailDomains: domains.map((d) => d.toLowerCase()),
    region: isUS ? getRegion(school["state-province"]) : "international",
    metadata: {
      dataSource: "api",
      lastSyncedAt: new Date(),
    },
    isActive: true,
  };
}

// Transform Scorecard data to University schema
function transformScorecardData(school) {
  const ownership = school["school.ownership"];
  let type = "";
  if (ownership === 1) type = "public";
  else if (ownership === 2) type = "private-nonprofit";
  else if (ownership === 3) type = "private-forprofit";

  const state = school["school.state"] || "";

  return {
    name: school["school.name"],
    country: "United States",
    city: school["school.city"] || "",
    state: state,
    zip: school["school.zip"] || "",
    website: school["school.school_url"] ? `https://${school["school.school_url"]}` : "",
    priceCalculatorUrl: school["school.price_calculator_url"] || "",
    coordinates: {
      latitude: school["location.lat"] || null,
      longitude: school["location.lon"] || null,
    },
    type: type,
    region: getRegion(state),
    stats: {
      studentSize: school["latest.student.size"] || 0,
      admissionRate: school["latest.admissions.admission_rate.overall"] || null,
      graduationRate: school["latest.completion.rate_suppressed.overall"] || null,
      retentionRate: school["latest.student.retention_rate.overall.full_time"] || null,
      avgSat: school["latest.admissions.sat_scores.average.overall"] || null,
      avgAct: school["latest.admissions.act_scores.midpoint.cumulative"] || null,
      satRange: {
        low: school["latest.admissions.sat_scores.25th_percentile.critical_reading"]
          ? school["latest.admissions.sat_scores.25th_percentile.critical_reading"] +
            school["latest.admissions.sat_scores.25th_percentile.math"]
          : null,
        high: school["latest.admissions.sat_scores.75th_percentile.critical_reading"]
          ? school["latest.admissions.sat_scores.75th_percentile.critical_reading"] +
            school["latest.admissions.sat_scores.75th_percentile.math"]
          : null,
      },
      actRange: {
        low: school["latest.admissions.act_scores.25th_percentile.cumulative"] || null,
        high: school["latest.admissions.act_scores.75th_percentile.cumulative"] || null,
      },
    },
    demographics: {
      percentMale: school["latest.student.demographics.men"]
        ? Math.round(school["latest.student.demographics.men"] * 100)
        : null,
      percentFemale: school["latest.student.demographics.women"]
        ? Math.round(school["latest.student.demographics.women"] * 100)
        : null,
    },
    costs: {
      tuitionInState: school["latest.cost.tuition.in_state"] || null,
      tuitionOutState: school["latest.cost.tuition.out_of_state"] || null,
      roomAndBoard: school["latest.cost.roomboard.oncampus"] || null,
      booksAndSupplies: school["latest.cost.booksupply"] || null,
      avgNetPrice: school["latest.cost.avg_net_price.overall"] || null,
      percentReceivingAid: school["latest.aid.pell_grant_rate"]
        ? Math.round(school["latest.aid.pell_grant_rate"] * 100)
        : null,
    },
    outcomes: {
      medianEarnings6yr: school["latest.earnings.6_yrs_after_entry.median"] || null,
      medianEarnings10yr: school["latest.earnings.10_yrs_after_entry.median"] || null,
      medianDebt: school["latest.aid.median_debt.completers.overall"] || null,
      loanDefaultRate: school["latest.repayment.3_yr_default_rate"] || null,
    },
    metadata: {
      dataSource: "college-scorecard",
      scorecardId: school.id,
      lastSyncedAt: new Date(),
    },
    isActive: true,
  };
}

// Batch upsert to MongoDB
async function batchUpsert(University, universities, batchSize = 100) {
  let processed = 0;
  let created = 0;
  let updated = 0;

  for (let i = 0; i < universities.length; i += batchSize) {
    const batch = universities.slice(i, i + batchSize);
    const operations = batch.map((uni) => ({
      updateOne: {
        filter: {
          $or: [
            { "metadata.scorecardId": uni.metadata?.scorecardId },
            { name: uni.name, state: uni.state || "", country: uni.country },
          ].filter((f) => f["metadata.scorecardId"] || f.name),
        },
        update: { $set: uni },
        upsert: true,
      },
    }));

    const result = await University.bulkWrite(operations, { ordered: false });
    processed += batch.length;
    created += result.upsertedCount || 0;
    updated += result.modifiedCount || 0;

    process.stdout.write(`\r  Processed ${processed}/${universities.length} (Created: ${created}, Updated: ${updated})`);
  }

  console.log("");
  return { processed, created, updated };
}

// Merge Hipo and Scorecard data
function mergeUniversities(hipoData, scorecardData) {
  const scorecardMap = new Map();

  // Index scorecard by normalized name + state
  for (const school of scorecardData) {
    const key = `${school.name.toLowerCase().trim()}|${school.state || ""}`;
    scorecardMap.set(key, school);
  }

  const merged = [...scorecardData];
  let hipoAdded = 0;

  // Add Hipo schools not in Scorecard
  for (const school of hipoData) {
    const key = `${school.name.toLowerCase().trim()}|${school.state || ""}`;
    if (!scorecardMap.has(key)) {
      // Check if US school might match scorecard by partial name
      if (school.country === "United States") {
        const possibleMatch = scorecardData.find(
          (s) =>
            s.name.toLowerCase().includes(school.name.toLowerCase().split(" ")[0]) &&
            s.state === school.state
        );
        if (possibleMatch) {
          // Merge email domains from Hipo into scorecard match
          if (school.emailDomains?.length) {
            possibleMatch.emailDomains = [
              ...new Set([...(possibleMatch.emailDomains || []), ...school.emailDomains]),
            ];
          }
          continue;
        }
      }
      merged.push(school);
      hipoAdded++;
    } else {
      // Merge email domains
      const existing = scorecardMap.get(key);
      if (school.emailDomains?.length) {
        existing.emailDomains = [
          ...new Set([...(existing.emailDomains || []), ...school.emailDomains]),
        ];
      }
    }
  }

  console.log(`  Merged: ${scorecardData.length} Scorecard + ${hipoAdded} Hipo-only = ${merged.length} total`);
  return merged;
}

// Main seeder
async function seedUniversities() {
  const options = parseArgs();
  const startTime = Date.now();

  console.log("\n=== University Seeder ===\n");
  console.log("Options:", options);
  console.log("");

  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Error: MONGO_URI not set in environment");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB\n");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }

  // Import University model
  const { default: University } = await import("../src/models/university.model.js");

  let universities = [];

  try {
    if (options.hipoOnly) {
      // Hipo only mode
      const hipoData = await fetchHipoUniversities();
      const limit = options.limit || hipoData.length;
      universities = hipoData.slice(0, limit).map(transformHipoData);
    } else if (options.usOnly) {
      // US only from Scorecard
      const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
      if (!apiKey) {
        console.error("Error: COLLEGE_SCORECARD_API_KEY not set");
        console.log("Get a free key at: https://api.data.gov/signup/");
        process.exit(1);
      }

      const scorecardData = await fetchScorecardUniversities(apiKey, options.limit);
      universities = scorecardData.map(transformScorecardData);

      // Add email domains from Hipo for US schools
      console.log("\nFetching Hipo data for email domains...");
      const hipoUS = await fetchHipoUniversities("United States");
      const hipoTransformed = hipoUS.map(transformHipoData);

      // Merge email domains
      const hipoMap = new Map();
      for (const h of hipoTransformed) {
        const key = h.name.toLowerCase().trim();
        hipoMap.set(key, h);
      }

      for (const uni of universities) {
        const hipoMatch = hipoMap.get(uni.name.toLowerCase().trim());
        if (hipoMatch?.emailDomains?.length) {
          uni.emailDomains = hipoMatch.emailDomains;
        }
      }
    } else {
      // Full seed: Scorecard + Hipo worldwide
      const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;

      let scorecardData = [];
      if (apiKey) {
        scorecardData = await fetchScorecardUniversities(apiKey, options.limit);
        scorecardData = scorecardData.map(transformScorecardData);
      } else {
        console.log("Note: COLLEGE_SCORECARD_API_KEY not set, skipping US detailed data");
        console.log("Get a free key at: https://api.data.gov/signup/\n");
      }

      console.log("\nFetching worldwide data from Hipo...");
      const hipoData = await fetchHipoUniversities();
      const hipoTransformed = hipoData.map(transformHipoData);

      if (scorecardData.length > 0) {
        universities = mergeUniversities(hipoTransformed, scorecardData);
      } else {
        universities = options.limit ? hipoTransformed.slice(0, options.limit) : hipoTransformed;
      }
    }

    console.log(`\nPrepared ${universities.length} universities for upsert\n`);

    // Batch upsert
    console.log("Upserting to database...");
    const result = await batchUpsert(University, universities);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n=== Seeding Complete ===`);
    console.log(`  Processed: ${result.processed}`);
    console.log(`  Created: ${result.created}`);
    console.log(`  Updated: ${result.updated}`);
    console.log(`  Time: ${elapsed}s\n`);
  } catch (error) {
    console.error("\nSeeding error:", error.message);
    if (error.response) {
      console.error("API response:", error.response.status, error.response.statusText);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedUniversities();
