#!/usr/bin/env node

/**
 * Validation script to ensure all schools in data/schools.json have unique IDs
 * This script checks that:
 * 1. All top-level keys (school identifiers) are unique
 * 2. All "id" fields within school objects match their keys
 * 3. No duplicate IDs exist
 */

const fs = require('fs');
const path = require('path');

const schoolsFile = path.join(__dirname, 'data', 'schools.json');

try {
    // Read and parse the schools.json file
    const data = fs.readFileSync(schoolsFile, 'utf8');
    const schools = JSON.parse(data);
    
    const schoolKeys = Object.keys(schools);
    const schoolIds = [];
    let errors = [];
    let warnings = [];
    
    console.log(`\n📚 Validating ${schoolKeys.length} schools in data/schools.json...\n`);
    
    // Check each school
    schoolKeys.forEach(key => {
        const school = schools[key];
        
        // Check if school has an id field
        if (!school.id) {
            errors.push(`School with key "${key}" is missing an "id" field`);
            return;
        }
        
        // Check if the key matches the id
        if (school.id !== key) {
            warnings.push(`School key "${key}" does not match id "${school.id}"`);
        }
        
        // Collect all IDs
        schoolIds.push(school.id);
    });
    
    // Check for duplicate IDs
    const idCounts = {};
    schoolIds.forEach(id => {
        idCounts[id] = (idCounts[id] || 0) + 1;
    });
    
    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
    
    if (duplicates.length > 0) {
        errors.push(`\nDuplicate IDs found:`);
        duplicates.forEach(([id, count]) => {
            errors.push(`  - "${id}" appears ${count} times`);
        });
    }
    
    // Report results
    if (errors.length > 0) {
        console.log('❌ ERRORS FOUND:\n');
        errors.forEach(error => console.log(`   ${error}`));
        console.log('');
        process.exit(1);
    }
    
    if (warnings.length > 0) {
        console.log('⚠️  WARNINGS:\n');
        warnings.forEach(warning => console.log(`   ${warning}`));
        console.log('');
    }
    
    console.log('✅ All schools have unique IDs!');
    console.log(`   Total schools: ${schoolKeys.length}`);
    console.log(`   All IDs are unique and properly structured\n`);
    
} catch (error) {
    console.error('❌ Error reading or parsing schools.json:', error.message);
    process.exit(1);
}
