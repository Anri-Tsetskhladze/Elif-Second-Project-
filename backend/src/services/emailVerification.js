import crypto from "crypto";
import University from "../models/university.model.js";
import User from "../models/user.model.js";

// Blocked personal email providers
const BLOCKED_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.net",
  "inbox.com",
  "fastmail.com",
  "tutanota.com",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "rediffmail.com",
  "web.de",
  "libero.it",
  "virgilio.it",
  "laposte.net",
  "orange.fr",
  "mail.ru",
  "rambler.ru",
  "ukr.net",
  "seznam.cz",
  "wp.pl",
  "o2.pl",
  "interia.pl",
  "t-online.de",
  "freenet.de",
  "arcor.de",
];

// Academic TLD patterns
const ACADEMIC_TLDS = [
  ".edu",
  ".edu.au",
  ".edu.cn",
  ".edu.tw",
  ".edu.hk",
  ".edu.sg",
  ".edu.my",
  ".edu.ph",
  ".edu.vn",
  ".edu.in",
  ".edu.pk",
  ".edu.bd",
  ".edu.np",
  ".edu.lk",
  ".edu.br",
  ".edu.mx",
  ".edu.ar",
  ".edu.co",
  ".edu.pe",
  ".edu.cl",
  ".edu.eg",
  ".edu.za",
  ".edu.ng",
  ".edu.ke",
  ".edu.gh",
  ".edu.tr",
  ".edu.sa",
  ".edu.ae",
  ".edu.jo",
  ".edu.il",
  ".edu.ru",
  ".edu.ua",
  ".edu.pl",
  ".ac.uk",
  ".ac.nz",
  ".ac.jp",
  ".ac.kr",
  ".ac.th",
  ".ac.id",
  ".ac.in",
  ".ac.za",
  ".ac.il",
  ".ac.ir",
  ".ac.at",
  ".ac.be",
  ".ac.cy",
  ".uni-",
  ".university",
  ".college",
  ".school",
];

// Student email patterns
const STUDENT_PATTERNS = [
  /^student/i,
  /^stu\d/i,
  /^s\d{5,}/i,
  /^\d{5,}@/,
  /^[a-z]{2,3}\d{4,}@/i,
  /^[a-z]+\.\d{4}@/i,
  /^[a-z]+_[a-z]+\d{2,}@/i,
];

// Faculty/staff patterns (not students)
const STAFF_PATTERNS = [
  /^admin@/i,
  /^info@/i,
  /^contact@/i,
  /^support@/i,
  /^help@/i,
  /^webmaster@/i,
  /^postmaster@/i,
  /^noreply@/i,
  /^no-reply@/i,
  /^hr@/i,
  /^careers@/i,
  /^admissions@/i,
  /^registrar@/i,
  /^library@/i,
  /^press@/i,
  /^media@/i,
  /^marketing@/i,
  /^communications@/i,
  /^president@/i,
  /^chancellor@/i,
  /^dean@/i,
  /^provost@/i,
];

// Extract domain from email
function extractDomain(email) {
  if (!email || typeof email !== "string") return null;

  const parts = email.toLowerCase().trim().split("@");
  if (parts.length !== 2) return null;

  return parts[1];
}

// Extract base domain (remove subdomains for matching)
function extractBaseDomain(domain) {
  if (!domain) return null;

  const parts = domain.split(".");

  // Handle .edu directly
  if (domain.endsWith(".edu") && parts.length >= 2) {
    return parts.slice(-2).join(".");
  }

  // Handle .ac.uk, .edu.au style
  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join(".");
    if (
      lastTwo.match(/^(ac|edu|edu)\.[a-z]{2}$/) ||
      lastTwo.match(/^(co|com|org|net)\.[a-z]{2}$/)
    ) {
      return parts.slice(-3).join(".");
    }
  }

  // Standard domain
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }

  return domain;
}

// Check if domain is blocked
function isBlockedDomain(domain) {
  if (!domain) return true;

  const baseDomain = extractBaseDomain(domain);
  return BLOCKED_DOMAINS.includes(domain) || BLOCKED_DOMAINS.includes(baseDomain);
}

// Check if domain is academic
function isAcademicDomain(domain) {
  if (!domain) return false;

  const lowerDomain = domain.toLowerCase();

  for (const tld of ACADEMIC_TLDS) {
    if (lowerDomain.endsWith(tld) || lowerDomain.includes(tld)) {
      return true;
    }
  }

  return false;
}

// Check if email looks like a student email
function looksLikeStudentEmail(email) {
  if (!email) return { isStudent: false, confidence: 0 };

  const lowerEmail = email.toLowerCase();

  // Check staff patterns first
  for (const pattern of STAFF_PATTERNS) {
    if (pattern.test(lowerEmail)) {
      return { isStudent: false, confidence: 0.9, reason: "staff-pattern" };
    }
  }

  // Check student patterns
  for (const pattern of STUDENT_PATTERNS) {
    if (pattern.test(lowerEmail)) {
      return { isStudent: true, confidence: 0.8, reason: "student-pattern" };
    }
  }

  // Default: assume student if from academic domain
  const domain = extractDomain(email);
  if (isAcademicDomain(domain)) {
    return { isStudent: true, confidence: 0.5, reason: "academic-domain" };
  }

  return { isStudent: false, confidence: 0.3, reason: "unknown" };
}

// Find university by domain
async function findUniversityByDomain(domain) {
  if (!domain) return null;

  const baseDomain = extractBaseDomain(domain);

  // Try exact match first
  let university = await University.findOne({
    emailDomains: domain,
    isActive: true,
  });

  if (university) return university;

  // Try base domain
  if (baseDomain !== domain) {
    university = await University.findOne({
      emailDomains: baseDomain,
      isActive: true,
    });

    if (university) return university;
  }

  // Try partial match
  university = await University.findOne({
    emailDomains: { $regex: baseDomain, $options: "i" },
    isActive: true,
  });

  return university;
}

// Find university by email
async function findUniversityByEmail(email) {
  const domain = extractDomain(email);
  return findUniversityByDomain(domain);
}

// Suggest universities by partial domain
async function suggestUniversitiesByDomain(partialDomain, limit = 10) {
  if (!partialDomain || partialDomain.length < 2) return [];

  const universities = await University.find({
    isActive: true,
    emailDomains: { $regex: partialDomain, $options: "i" },
  })
    .limit(limit)
    .select("name city state emailDomains images.logo");

  return universities;
}

// Main verification function
async function verifyStudentEmail(email) {
  if (!email || typeof email !== "string") {
    return {
      isValid: false,
      isStudent: false,
      university: null,
      message: "Email is required",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return {
      isValid: false,
      isStudent: false,
      university: null,
      message: "Invalid email format",
    };
  }

  const domain = extractDomain(normalizedEmail);

  // Check blocked domains
  if (isBlockedDomain(domain)) {
    return {
      isValid: false,
      isStudent: false,
      university: null,
      message: "Personal email addresses are not allowed. Please use your university email.",
      domain,
    };
  }

  // Check if academic domain
  const isAcademic = isAcademicDomain(domain);

  // Find university in database
  const university = await findUniversityByDomain(domain);

  // Analyze email pattern
  const studentAnalysis = looksLikeStudentEmail(normalizedEmail);

  if (university) {
    return {
      isValid: true,
      isStudent: studentAnalysis.isStudent,
      studentConfidence: studentAnalysis.confidence,
      university: {
        _id: university._id,
        name: university.name,
        city: university.city,
        state: university.state,
        country: university.country,
        logo: university.images?.logo,
      },
      domain,
      isAcademicDomain: true,
      message: `Email verified for ${university.name}`,
    };
  }

  if (isAcademic) {
    return {
      isValid: true,
      isStudent: studentAnalysis.isStudent,
      studentConfidence: studentAnalysis.confidence,
      university: null,
      domain,
      isAcademicDomain: true,
      message: "Academic email detected but university not in our database",
      suggestion: "Your university may be added upon verification",
    };
  }

  return {
    isValid: false,
    isStudent: false,
    university: null,
    domain,
    isAcademicDomain: false,
    message: "This does not appear to be a student email address",
  };
}

// Generate verification code
function generateVerificationCode(length = 6) {
  const code = crypto.randomInt(0, Math.pow(10, length)).toString();
  return code.padStart(length, "0");
}

// Generate verification token
function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Create verification record
async function createVerification(userId, studentEmail) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Check if email already verified by another user
  const existingUser = await User.findOne({
    studentEmail: studentEmail.toLowerCase(),
    isVerifiedStudent: true,
    _id: { $ne: userId },
  });

  if (existingUser) {
    throw new Error("This email is already verified by another account");
  }

  // Verify email domain
  const verification = await verifyStudentEmail(studentEmail);
  if (!verification.isValid) {
    throw new Error(verification.message);
  }

  // Generate token
  const token = generateVerificationToken();
  const code = generateVerificationCode();

  // Update user
  user.studentEmail = studentEmail.toLowerCase();
  user.verificationToken = token;
  user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  return {
    token,
    code,
    email: studentEmail,
    university: verification.university,
    expiresAt: user.verificationTokenExpires,
  };
}

// Verify code and complete verification
async function completeVerification(userId, token) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.verificationToken || !user.verificationTokenExpires) {
    throw new Error("No pending verification");
  }

  if (new Date() > user.verificationTokenExpires) {
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    throw new Error("Verification token expired");
  }

  if (user.verificationToken !== token) {
    throw new Error("Invalid verification token");
  }

  // Find and join university
  const university = await findUniversityByEmail(user.studentEmail);

  user.isVerifiedStudent = true;
  user.studentVerifiedAt = new Date();
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;

  if (user.role === "prospective") {
    user.role = "student";
  }

  if (university && !user.university) {
    await user.joinUniversity(university._id);
  } else {
    await user.save();
  }

  return {
    success: true,
    user,
    university,
    message: university
      ? `Verified and joined ${university.name}`
      : "Student email verified",
  };
}

// Resend verification
async function resendVerification(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.studentEmail) {
    throw new Error("No student email set");
  }

  if (user.isVerifiedStudent) {
    throw new Error("Already verified");
  }

  const token = generateVerificationToken();
  const code = generateVerificationCode();

  user.verificationToken = token;
  user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  return {
    token,
    code,
    email: user.studentEmail,
    expiresAt: user.verificationTokenExpires,
  };
}

// Check verification status
async function checkVerificationStatus(userId) {
  const user = await User.findById(userId).select(
    "studentEmail isVerifiedStudent studentVerifiedAt verificationTokenExpires university"
  );

  if (!user) {
    throw new Error("User not found");
  }

  return {
    studentEmail: user.studentEmail,
    isVerified: user.isVerifiedStudent,
    verifiedAt: user.studentVerifiedAt,
    hasPendingVerification: !!(
      user.verificationTokenExpires && new Date() < user.verificationTokenExpires
    ),
    pendingExpires: user.verificationTokenExpires,
    hasUniversity: !!user.university,
  };
}

// Batch check domains
async function batchCheckDomains(domains) {
  const results = [];

  for (const domain of domains) {
    const isBlocked = isBlockedDomain(domain);
    const isAcademic = isAcademicDomain(domain);
    const university = await findUniversityByDomain(domain);

    results.push({
      domain,
      isBlocked,
      isAcademic,
      hasUniversity: !!university,
      universityName: university?.name || null,
    });
  }

  return results;
}

export {
  verifyStudentEmail,
  extractDomain,
  extractBaseDomain,
  isBlockedDomain,
  isAcademicDomain,
  looksLikeStudentEmail,
  findUniversityByDomain,
  findUniversityByEmail,
  suggestUniversitiesByDomain,
  generateVerificationCode,
  generateVerificationToken,
  createVerification,
  completeVerification,
  resendVerification,
  checkVerificationStatus,
  batchCheckDomains,
  BLOCKED_DOMAINS,
  ACADEMIC_TLDS,
};

export default {
  verifyStudentEmail,
  extractDomain,
  extractBaseDomain,
  isBlockedDomain,
  isAcademicDomain,
  looksLikeStudentEmail,
  findUniversityByDomain,
  findUniversityByEmail,
  suggestUniversitiesByDomain,
  generateVerificationCode,
  generateVerificationToken,
  createVerification,
  completeVerification,
  resendVerification,
  checkVerificationStatus,
  batchCheckDomains,
};
