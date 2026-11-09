
module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': [
            '@swc/jest',
            {
                jsc: {
                    parser: {
                        syntax: 'typescript'
                    },
                    target: 'es2022'
                },
                module: {
                    type: 'commonjs'
                }
            }
        ]
    },
    clearMocks: true
};
