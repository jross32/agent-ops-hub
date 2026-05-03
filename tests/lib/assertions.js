'use strict';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEq(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertIncludes(list, value, message) {
  if (!Array.isArray(list) || !list.includes(value)) {
    throw new Error(message || `Expected list to include ${value}`);
  }
}

module.exports = { assert, assertEq, assertIncludes };
