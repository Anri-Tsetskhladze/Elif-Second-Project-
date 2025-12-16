# MongoDB Atlas Search Index Configuration

## Overview
Atlas Search provides better search capabilities including fuzzy matching, autocomplete, and relevance scoring.

## Creating Search Indexes

Navigate to MongoDB Atlas Dashboard → Your Cluster → Search → Create Search Index

---

## 1. Universities Collection

### Main Search Index
**Index Name:** `universities_search`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "city": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "state": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "country": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "description": {
        "type": "string",
        "analyzer": "lucene.standard"
      }
    }
  }
}
```

### Autocomplete Index
**Index Name:** `universities_autocomplete`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": {
        "type": "autocomplete",
        "tokenization": "edgeGram",
        "minGrams": 2,
        "maxGrams": 15,
        "foldDiacritics": true
      }
    }
  }
}
```

---

## 2. Users Collection

### Main Search Index
**Index Name:** `users_search`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "username": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "fullName": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "firstName": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "lastName": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "bio": {
        "type": "string",
        "analyzer": "lucene.standard"
      }
    }
  }
}
```

### Autocomplete Index
**Index Name:** `users_autocomplete`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "username": {
        "type": "autocomplete",
        "tokenization": "edgeGram",
        "minGrams": 2,
        "maxGrams": 20
      },
      "fullName": {
        "type": "autocomplete",
        "tokenization": "edgeGram",
        "minGrams": 2,
        "maxGrams": 30
      }
    }
  }
}
```

---

## 3. Posts Collection

### Main Search Index
**Index Name:** `posts_search`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "content": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "tags": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "category": {
        "type": "stringFacet"
      },
      "status": {
        "type": "stringFacet"
      }
    }
  }
}
```

---

## 4. Notes Collection

### Main Search Index
**Index Name:** `notes_search`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "description": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "subject": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "course": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "tags": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "noteType": {
        "type": "stringFacet"
      },
      "status": {
        "type": "stringFacet"
      }
    }
  }
}
```

### Autocomplete Index
**Index Name:** `notes_autocomplete`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "subject": {
        "type": "autocomplete",
        "tokenization": "edgeGram",
        "minGrams": 2,
        "maxGrams": 20
      },
      "course": {
        "type": "autocomplete",
        "tokenization": "edgeGram",
        "minGrams": 2,
        "maxGrams": 20
      }
    }
  }
}
```

---

## 5. Reviews Collection

### Main Search Index
**Index Name:** `reviews_search`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "content": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "pros": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "cons": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "status": {
        "type": "stringFacet"
      }
    }
  }
}
```

---

## Verification

After creating indexes, verify they are active:

```javascript
// In MongoDB shell or Compass
db.universities.aggregate([
  {
    $search: {
      index: "universities_search",
      text: {
        query: "harvard",
        path: ["name", "city"]
      }
    }
  },
  { $limit: 5 }
])
```

---

## Notes

- Atlas Search indexes may take a few minutes to build
- Index status should be "Active" before use
- Free tier (M0) clusters support Atlas Search
- Indexes are automatically updated when documents change
