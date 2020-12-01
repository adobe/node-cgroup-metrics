/*
Copyright 2019 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

'use strict';

module.exports = {
    "extends": [
        "problems"
    ],
    "env": {
        "node": true
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "plugins": [
        "mocha"
    ],
    "rules": {
        "prefer-arrow-callback": 0,
        "prefer-template": 1,
        "object-shorthand": 0,

        // console.* is wanted in OpenWhisk actions
        "no-console": [0, {"allow": true}],

        "template-curly-spacing": [1, "never"],

        // mocha rules intended to catch common problems:
        // - tests marked with .only() is usually only during development
        // - tests with identical titles are confusing
        // - tests defined using () => {} notation do not have access to globals
        // - tests nested in tests is confusing
        // - empty tests point to incomplete code
        // - mocha allows for synch tests, async tests using 'done' callback,
        //   async tests using Promise. Combining callback and a return of some value
        //   indicates mixing up the test types
        // - multiple before/after hooks in a single test suite/test is confusing
        // - passing async functions to describe() is usually wrong, the individual tests
        //   can be async however
        "mocha/no-exclusive-tests": "error",
        "mocha/no-identical-title": "error",
        "mocha/no-mocha-arrows": "error",
        "mocha/no-nested-tests": "error",
        "mocha/no-pending-tests": "error",
        "mocha/no-return-and-callback": "error",
        "mocha/no-sibling-hooks": "error",
        "mocha/no-async-describe": "error"
    }
};