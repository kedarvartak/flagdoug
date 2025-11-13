/**
 * Simple verification script to check Swagger configuration
 * This script verifies that all necessary Swagger decorators are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Swagger API Documentation Configuration...\n');

const checks = [];

// Check 1: Verify main.ts has Swagger configuration
const mainTsPath = path.join(__dirname, 'src', 'main.ts');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

if (mainTsContent.includes('SwaggerModule') && mainTsContent.includes('DocumentBuilder')) {
  checks.push({ name: 'Swagger imports in main.ts', status: '✅' });
} else {
  checks.push({ name: 'Swagger imports in main.ts', status: '❌' });
}

if (mainTsContent.includes("SwaggerModule.setup('api/docs'")) {
  checks.push({ name: 'Swagger setup at /api/docs', status: '✅' });
} else {
  checks.push({ name: 'Swagger setup at /api/docs', status: '❌' });
}

if (mainTsContent.includes('.setTitle(') && mainTsContent.includes('.setDescription(') && mainTsContent.includes('.setVersion(')) {
  checks.push({ name: 'Swagger document metadata', status: '✅' });
} else {
  checks.push({ name: 'Swagger document metadata', status: '❌' });
}

if (mainTsContent.includes("addTag('flags'") && mainTsContent.includes("addTag('evaluation'") && mainTsContent.includes("addTag('health'")) {
  checks.push({ name: 'API tags configuration', status: '✅' });
} else {
  checks.push({ name: 'API tags configuration', status: '❌' });
}

// Check 2: Verify DTOs have @ApiProperty decorators
const dtoFiles = [
  'src/flags/dto/create-flag.dto.ts',
  'src/flags/dto/update-flag.dto.ts',
  'src/flags/dto/toggle-flag.dto.ts',
  'src/flags/dto/create-flag-environment.dto.ts'
];

dtoFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('@ApiProperty')) {
      checks.push({ name: `@ApiProperty in ${path.basename(file)}`, status: '✅' });
    } else {
      checks.push({ name: `@ApiProperty in ${path.basename(file)}`, status: '❌' });
    }
  }
});

// Check 3: Verify entities have @ApiProperty decorators
const entityFiles = [
  'src/flags/entities/flag.entity.ts',
  'src/flags/entities/flag-environment.entity.ts'
];

entityFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('@ApiProperty')) {
      checks.push({ name: `@ApiProperty in ${path.basename(file)}`, status: '✅' });
    } else {
      checks.push({ name: `@ApiProperty in ${path.basename(file)}`, status: '❌' });
    }
  }
});

// Check 4: Verify controllers have Swagger decorators
const controllerFiles = [
  'src/flags/flags.controller.ts',
  'src/evaluation/evaluation.controller.ts',
  'src/health/health.controller.ts'
];

controllerFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasApiTags = content.includes('@ApiTags');
    const hasApiOperation = content.includes('@ApiOperation');
    const hasApiResponse = content.includes('@ApiResponse');
    
    if (hasApiTags && hasApiOperation && hasApiResponse) {
      checks.push({ name: `Swagger decorators in ${path.basename(file)}`, status: '✅' });
    } else {
      checks.push({ name: `Swagger decorators in ${path.basename(file)}`, status: '❌' });
    }
  }
});

// Check 5: Verify package.json has @nestjs/swagger
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.dependencies['@nestjs/swagger']) {
  checks.push({ name: '@nestjs/swagger package installed', status: '✅' });
} else {
  checks.push({ name: '@nestjs/swagger package installed', status: '❌' });
}

// Print results
console.log('Verification Results:');
console.log('═'.repeat(50));
checks.forEach(check => {
  console.log(`${check.status} ${check.name}`);
});
console.log('═'.repeat(50));

const allPassed = checks.every(check => check.status === '✅');
const passedCount = checks.filter(check => check.status === '✅').length;
const totalCount = checks.length;

console.log(`\n${passedCount}/${totalCount} checks passed`);

if (allPassed) {
  console.log('\n✨ Swagger API documentation is fully configured!');
  console.log('\nTo view the documentation:');
  console.log('1. Start the server: npm run start:dev');
  console.log('2. Open: http://localhost:3000/api/docs');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review the configuration.');
  process.exit(1);
}
