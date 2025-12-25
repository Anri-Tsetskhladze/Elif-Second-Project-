import { ENV } from "../config/env.js";

const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools";

const FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.zip",
  "school.school_url",
  "school.ownership",
  "location.lat",
  "location.lon",
  "latest.student.size",
  "latest.admissions.admission_rate.overall",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.admissions.sat_scores.average.overall",
  "latest.admissions.act_scores.midpoint.cumulative",
].join(",");

// Transform API response to app format
function transformUniversity(school) {
  const ownership = school["school.ownership"];
  let type = "public";
  if (ownership === 2) type = "private-nonprofit";
  else if (ownership === 3) type = "private-forprofit";

  return {
    id: school.id,
    name: school["school.name"],
    city: school["school.city"] || "",
    state: school["school.state"] || "",
    zip: school["school.zip"] || "",
    country: "United States",
    website: school["school.school_url"] ? `https://${school["school.school_url"]}` : "",
    type,
    coordinates: {
      latitude: school["location.lat"],
      longitude: school["location.lon"],
    },
    stats: {
      studentSize: school["latest.student.size"] || 0,
      admissionRate: school["latest.admissions.admission_rate.overall"],
      avgSat: school["latest.admissions.sat_scores.average.overall"],
      avgAct: school["latest.admissions.act_scores.midpoint.cumulative"],
    },
    costs: {
      tuitionInState: school["latest.cost.tuition.in_state"],
      tuitionOutState: school["latest.cost.tuition.out_of_state"],
    },
  };
}

// Search universities
export async function searchUniversities(options = {}) {
  const { query, state, page = 1, limit = 20 } = options;

  const params = new URLSearchParams({
    api_key: ENV.COLLEGE_SCORECARD_API_KEY,
    fields: FIELDS,
    per_page: Math.min(limit, 100),
    page: page - 1,
  });

  if (query) {
    params.append("school.name", query);
  }
  if (state) {
    params.append("school.state", state.toUpperCase());
  }

  const response = await fetch(`${BASE_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`College Scorecard API error: ${response.status}`);
  }

  const data = await response.json();
  const universities = (data.results || []).map(transformUniversity);
  const total = data.metadata?.total || 0;

  return {
    universities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// Get university by ID
export async function getUniversityById(id) {
  const params = new URLSearchParams({
    api_key: ENV.COLLEGE_SCORECARD_API_KEY,
    fields: FIELDS,
    id: id,
  });

  const response = await fetch(`${BASE_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`College Scorecard API error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    return null;
  }

  return transformUniversity(data.results[0]);
}

// Get states list
export async function getStates() {
  const states = [
    { state: "AL", name: "Alabama" },
    { state: "AK", name: "Alaska" },
    { state: "AZ", name: "Arizona" },
    { state: "AR", name: "Arkansas" },
    { state: "CA", name: "California" },
    { state: "CO", name: "Colorado" },
    { state: "CT", name: "Connecticut" },
    { state: "DE", name: "Delaware" },
    { state: "FL", name: "Florida" },
    { state: "GA", name: "Georgia" },
    { state: "HI", name: "Hawaii" },
    { state: "ID", name: "Idaho" },
    { state: "IL", name: "Illinois" },
    { state: "IN", name: "Indiana" },
    { state: "IA", name: "Iowa" },
    { state: "KS", name: "Kansas" },
    { state: "KY", name: "Kentucky" },
    { state: "LA", name: "Louisiana" },
    { state: "ME", name: "Maine" },
    { state: "MD", name: "Maryland" },
    { state: "MA", name: "Massachusetts" },
    { state: "MI", name: "Michigan" },
    { state: "MN", name: "Minnesota" },
    { state: "MS", name: "Mississippi" },
    { state: "MO", name: "Missouri" },
    { state: "MT", name: "Montana" },
    { state: "NE", name: "Nebraska" },
    { state: "NV", name: "Nevada" },
    { state: "NH", name: "New Hampshire" },
    { state: "NJ", name: "New Jersey" },
    { state: "NM", name: "New Mexico" },
    { state: "NY", name: "New York" },
    { state: "NC", name: "North Carolina" },
    { state: "ND", name: "North Dakota" },
    { state: "OH", name: "Ohio" },
    { state: "OK", name: "Oklahoma" },
    { state: "OR", name: "Oregon" },
    { state: "PA", name: "Pennsylvania" },
    { state: "RI", name: "Rhode Island" },
    { state: "SC", name: "South Carolina" },
    { state: "SD", name: "South Dakota" },
    { state: "TN", name: "Tennessee" },
    { state: "TX", name: "Texas" },
    { state: "UT", name: "Utah" },
    { state: "VT", name: "Vermont" },
    { state: "VA", name: "Virginia" },
    { state: "WA", name: "Washington" },
    { state: "WV", name: "West Virginia" },
    { state: "WI", name: "Wisconsin" },
    { state: "WY", name: "Wyoming" },
    { state: "DC", name: "District of Columbia" },
  ];
  return states;
}

export default {
  searchUniversities,
  getUniversityById,
  getStates,
};
