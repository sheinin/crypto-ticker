module.exports = {
    projects: ['./tests/local-jest.config.js'],
    transform: {
        '^.+\\.jsx$': 'babel-jest',
        '^.+\\.js$': 'babel-jest',
        ".+\\.(css|styl|less|sass|scss)$": "jest-transform-css"
    }
}
