export const required = (value, values, props) => {
    return value && value !== "" ? undefined : "Required"
}

export const validRange = (min, max) => value => {
    return value !== "" && (value < min || value > max) ? "Entered value is out of valid range" : undefined
}

export const expectedRange = (min, max) => value => {
    return value !== "" && (value < min || value > max) ? "Entered value is out of expected range" : undefined
}

export const babyBodyHeightExpectedRange = expectedRange(25, 80)
export const bodyHeightExpectedRange = expectedRange(40, 220)
export const babyBodyWeightExpectedRange = expectedRange(1000, 6000)
export const bodyWeightExpectedRange = expectedRange(20, 180)
export const bodyTemperatureExpectedRange = expectedRange(31, 43)
export const systolicBloodPressureExpectedRange = expectedRange(60, 170)
export const diastolicBloodPressureExpectedRange = expectedRange(45, 105)
export const heartRateValidRange = validRange(0, 300)
export const heartRateExpectedRange = expectedRange(40, 180)
export const oxygenSaturationExpectedRange = expectedRange(70, 100)
