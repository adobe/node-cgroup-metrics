/*
Copyright 2019 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe. 
*/

module.exports = {
    "extends": "problems",
    "env": {
        "node": true
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "prefer-arrow-callback": 0,
        "prefer-template": 1,
        "object-shorthand": 0,

        // console.* is wanted in OpenWhisk actions
        "no-console": [0, {"allow": true}],

        "template-curly-spacing": [1, "never"],
    }
};