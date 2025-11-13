#!/usr/bin/env node

/**
 * Simple script to test database connection pooling
 * This script verifies that the connection pool configuration is working correctly
 */

const { DataSource } = require('typeorm');
require('dotenv').config();

async function testConnectionPool() {
  console.log('Testing database connection pool configuration...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    extra: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || '2000',
        10,
      ),
    },
  });

  try {
    console.log('Initializing connection pool...');
    await dataSource.initialize();
    console.log('✓ Connection pool initialized successfully\n');

    console.log('Connection pool configuration:');
    console.log(`  - Max connections: ${process.env.DB_POOL_MAX || '10'}`);
    console.log(`  - Min connections: ${process.env.DB_POOL_MIN || '2'}`);
    console.log(
      `  - Idle timeout: ${process.env.DB_IDLE_TIMEOUT || '30000'}ms`,
    );
    console.log(
      `  - Connection timeout: ${process.env.DB_CONNECTION_TIMEOUT || '2000'}ms\n`,
    );

    // Test a simple query
    console.log('Testing query execution...');
    const startTime = Date.now();
    const result = await dataSource.query('SELECT NOW()');
    const endTime = Date.now();

    console.log(`✓ Query executed successfully in ${endTime - startTime}ms`);
    console.log(`  Result: ${result[0].now}\n`);

    // Test multiple concurrent queries
    console.log('Testing concurrent queries (simulating load)...');
    const concurrentQueries = 5;
    const promises = [];

    for (let i = 0; i < concurrentQueries; i++) {
      promises.push(
        dataSource.query('SELECT pg_sleep(0.1), $1 as query_num', [i + 1]),
      );
    }

    const concurrentStart = Date.now();
    await Promise.all(promises);
    const concurrentEnd = Date.now();

    console.log(
      `✓ ${concurrentQueries} concurrent queries completed in ${concurrentEnd - concurrentStart}ms\n`,
    );

    console.log('✓ All connection pool tests passed!');
  } catch (error) {
    console.error('✗ Connection pool test failed:', error.message);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n✓ Connection pool closed successfully');
    }
  }
}

testConnectionPool();
