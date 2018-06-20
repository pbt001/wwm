import React, { Component } from "react"
import { Field, Fields, FieldArray, formValueSelector, reduxForm } from "redux-form"
import { connect } from "react-redux"
import classnames from "classnames"

import Footer from "./footer"
import validate from "../shared/validatePersonal"
import {
    renderInput,
    renderHabitFields,
    renderRadio,
    renderSelect,
    renderHorizontalInput,
    renderHorizontalSelect,
    renderComplexHorizontalRadio
} from "shared/forms/renderField"
import { yesNoOptions, positiveNegativeOptions } from "shared/forms/options"
import { BABY_MAX_AGE, CHILD_MAX_AGE } from "shared/modules/config"
import { getCodesAsOptions, loadCategories as loadCategoriesImport } from "shared/modules/codes"

import { ReactComponent as RemoveIcon } from "shared/icons/negative.svg"

const numberOptions = Array.from(Array(9), (x, i) => ({
    label: i,
    value: i
}))

class Step3 extends Component {
    componentWillMount() {
        this.props.loadCategories("babyFood", "childCommunication", "deliveryType")
    }

    render() {
        const { handleSubmit, reset, previousPage, dateOfBirth, codesLoading, getCodes, creating } = this.props
        return (
            <form onSubmit={handleSubmit}>
                <div className="patient-form modal-body">
                    <div className="medicalHistory">
                        <RenderForm
                            dateOfBirth={dateOfBirth}
                            babyFoods={getCodes("babyFood")}
                            communicationTypes={getCodes("childCommunication")}
                            deliveryTypes={getCodes("deliveryType")}
                            codesLoading={codesLoading && !creating}
                        />
                    </div>
                </div>

                <Footer reset={reset} previousPage={previousPage} creating={creating} />
            </form>
        )
    }
}

let RenderForm = ({ dateOfBirth, babyFoods, communicationTypes, deliveryTypes, codesLoading, maxBabyAge, maxChildAge }) => {
    if (codesLoading) {
        return null
    }

    const age = (Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)

    if (age <= maxBabyAge) {
        return renderBabyForm({ babyFoods, deliveryTypes, communicationTypes })
    } else if (age <= maxChildAge) {
        return renderChildForm()
    } else {
        return renderAdultForm()
    }
}

RenderForm = connect(
    state => ({
        maxBabyAge: state.config[BABY_MAX_AGE],
        maxChildAge: state.config[CHILD_MAX_AGE]
    }),
    {}
)(RenderForm)

const renderAdultForm = props => (
    <div>
        <HealthAttributes />
        <HabitsAndLivingConditions />
    </div>
)

const renderBabyForm = ({ babyFoods, deliveryTypes, communicationTypes }) => (
    <div>
        <h3>Birth data</h3>
        <div className="section">
            <div className="birth">
                <div className="form-row">
                    <div className="form-group col-sm-4">
                        <Field name="deliveryType" component={renderSelect} options={deliveryTypes} label="Delivery type" />
                    </div>
                    <div className="form-group col-sm-8">
                        <Field name="prematurity" options={yesNoOptions} component={renderRadio} label="Prematurity?" />
                    </div>
                </div>
            </div>

            <div className="birth">
                <div className="form-row">
                    <div className="col-sm-4 text-left">
                        <div className="form-group valueWithUnit">
                            <Field name="weeksAtBirth" type="number" component={renderInput} label="Weeks at birth" />
                        </div>
                        <div className="unit">weeks</div>
                    </div>
                    <div className="col-sm-4 text-center">
                        <div className="form-group valueWithUnit">
                            <Field name="weightAtBirth" type="number" component={renderInput} label="Weight at birth" />
                        </div>
                        <div className="unit">grams</div>
                    </div>
                    <div className="col-sm-4 text-right">
                        <div className="form-group valueWithUnit">
                            <Field name="heightAtBirth" type="number" component={renderInput} label="Height at birth" />
                        </div>
                        <div className="unit">cm</div>
                    </div>
                </div>
            </div>
        </div>

        <HealthAttributes />
        <h3>Habits and living conditions</h3>
        <div className="section">
            <div className="habits">
                <Fields names={["breastfeeding"]} component={renderComplexHorizontalRadio} options={yesNoOptions} label="Breastfeeding?" />
                <Field name="breastfeedingDuration" type="number" component={renderHorizontalInput} label="For how long?" />
            </div>
            <div className="habits">
                <Field name="babyEatsAndDrinks" component={renderHorizontalSelect} options={babyFoods} label="What does your baby eat and drink?" />{" "}
                {/*@TODO codes */}
                <Field name="babyWetDiapers" component={renderHorizontalSelect} options={numberOptions} label="How many diapers does your child wet in 24h?" />
                <Field
                    name="babyBowelMovements"
                    component={renderHorizontalSelect}
                    options={numberOptions}
                    label="How frequent does your baby have bowel movements?"
                />{" "}
                {/*@ TODO codes */}
                <Field name="babyBowelMovementsComment" component={renderHorizontalInput} label="Describe baby's bowel movements" />
            </div>
            <div className="habits">
                <Fields
                    label="Are you satisfied with child's sleep?"
                    names={["babySleep", "babySleepComment"]}
                    component={renderComplexHorizontalRadio}
                    options={yesNoOptions}
                />
                <Fields names={["babySleepOnBack"]} component={renderComplexHorizontalRadio} options={yesNoOptions} label="Does your baby sleep on the back?" />
            </div>
            <div className="habits">
                <Fields names={["babyVitaminD"]} component={renderComplexHorizontalRadio} options={yesNoOptions} label="Do you or your baby take vitamin D?" />
                <Field name="babyGetsAround" component={renderHorizontalInput} label="How does your child get around?" />
                <Field name="babyCommunicates" component={renderHorizontalSelect} options={communicationTypes} label="How does your child communicate?" />
            </div>
            <div className="habits">
                <Fields names={["babyAnyoneSmokes"]} component={renderComplexHorizontalRadio} options={yesNoOptions} label="Does anyone at your house smoke?" />
                <Field name="babyNumberOfSmokers" component={renderHorizontalSelect} options={numberOptions} label="How many smokers?" />
            </div>
            <div className="habits">
                <Fields
                    label="Do you have access to clean water?"
                    names={["conditions_clean_water", "conditions_clean_water_comment"]}
                    component={renderComplexHorizontalRadio}
                    options={yesNoOptions}
                />
                <Fields
                    label="Do you have sufficient food supply?"
                    names={["conditions_food_supply", "conditions_food_supply_comment"]}
                    component={renderComplexHorizontalRadio}
                    options={yesNoOptions}
                />
                <Fields
                    label="Does your tent have heating?"
                    names={["conditions_heating", "conditions_heating_comment"]}
                    component={renderComplexHorizontalRadio}
                    options={yesNoOptions}
                />
                <Fields
                    label="Does your tent have electricity?"
                    names={["conditions_electricity", "conditions_electricity_comment"]}
                    component={renderComplexHorizontalRadio}
                    options={yesNoOptions}
                />
            </div>
        </div>
    </div>
)

const renderChildForm = () => (
    <React.Fragment>
        <div>
            <h3>Vaccination</h3>
            <div className="section">
                <div className="vaccination">
                    <Fields
                        names={["vaccinationUpToDate", "vaccinationUpToDateComment"]}
                        commentLabel="Comment"
                        commentAlways={true}
                        commentMultiline={true}
                        component={renderComplexHorizontalRadio}
                        options={yesNoOptions}
                        label="Was this child up to date with the home country vaccination schedule?"
                    />
                </div>
                <div className="vaccination">
                    <Fields
                        names={["vaccinationCertificates", "vaccinationCertificatesComment"]}
                        commentLabel="Comment"
                        commentAlways={true}
                        commentMultiline={true}
                        component={renderComplexHorizontalRadio}
                        options={yesNoOptions}
                        label="Do you have this child's immunization certificates?"
                    />
                </div>
                <div className="vaccination">
                    <Fields
                        names={["tuberculosisTested"]}
                        component={renderComplexHorizontalRadio}
                        options={yesNoOptions}
                        label="Has this child been tested for tuberculosis?"
                    />
                    <Fields
                        names={["tuberculosisTestResult"]}
                        subField={true}
                        component={renderComplexHorizontalRadio}
                        options={positiveNegativeOptions}
                        label="What was the result?"
                    />
                    <Fields
                        names={["tuberculosisAdditionalInvestigation", "tuberculosisAdditionalInvestigationDetails"]}
                        subField={true}
                        commentWhen="true"
                        commentLabel="Investigation details"
                        commentPlaceholder="Investigation details"
                        commentMultiline={true}
                        commentLabelAlwaysVisible={true}
                        component={renderComplexHorizontalRadio}
                        options={yesNoOptions}
                        label="Any additional investigation done?"
                    />
                </div>
                <div className="vaccination">
                    <Fields
                        names={["vaccinationReaction"]}
                        component={renderComplexHorizontalRadio}
                        options={yesNoOptions}
                        label="Has the child ever experienced vaccine reaction?"
                    />
                    <Fields
                        names={["vaccinationReactionInvestigation", "vaccinationReactionInvestigationDetails"]}
                        subField={true}
                        commentWhen="true"
                        commentLabel="Investigation details"
                        commentPlaceholder="Investigation details"
                        commentLabelAlwaysVisible={true}
                        commentMultiline={true}
                        component={renderComplexHorizontalRadio}
                        options={yesNoOptions}
                        label="Any additional investigation done?"
                    />
                </div>
            </div>
        </div>
        <HealthAttributes />
        <HabitsAndLivingConditions />
    </React.Fragment>
)

const HealthAttributes = () => (
    <div>
        <h3>Permanent health attributes</h3>
        <div className="section">
            <FieldArray name="allergies" component={renderAllergies} />
            <FieldArray name="immunizations" component={renderImmunizations} />
            <FieldArray name="chronicDiseases" component={renderChronicDiseases} />
            <FieldArray name="injuries" component={renderInjuries} />
            <FieldArray name="surgeries" component={renderSurgeries} />
            <FieldArray name="medications" component={renderMedications} />
        </div>
    </div>
)

const HabitsAndLivingConditions = () => (
    <div>
        <h3>Habits and living conditions</h3>
        <div className="section">
            <Fields label="Are you a smoker?" names={["habits_smoking", "habits_smoking_comment"]} commentWhen="true" component={renderHabitFields} />
            <Fields label="Are you taking drugs?" names={["habits_drugs", "habits_drugs_comment"]} commentWhen="true" component={renderHabitFields} />

            <Fields
                label="Do you have resources for basic hygiene?"
                names={["conditions_basic_hygiene", "conditions_basic_hygiene_comment"]}
                component={renderHabitFields}
            />

            <Fields
                label="Do you have access to clean water?"
                names={["conditions_clean_water", "conditions_clean_water_comment"]}
                component={renderHabitFields}
            />

            <Fields
                label="Do you have sufficient food supply?"
                names={["conditions_food_supply", "conditions_food_supply_comment"]}
                component={renderHabitFields}
            />

            <Fields
                label="Do you have a good appetite?"
                names={["conditions_good_appetite", "conditions_good_appetite_comment"]}
                component={renderHabitFields}
            />

            <Fields label="Does your tent have heating?" names={["conditions_heating", "conditions_heating_comment"]} component={renderHabitFields} />

            <Fields
                label="Does your tent have electricity?"
                names={["conditions_electricity", "conditions_electricity_comment"]}
                component={renderHabitFields}
            />
        </div>
    </div>
)

const renderAllergies = ({ fields, meta: { error, submitFailed } }) => (
    <div className={classnames("attributes", { open: fields.length })}>
        {fields.map((allergy, index) => (
            <div key={allergy} className="form-row">
                <div className="form-group col-sm-4">
                    <Field name={`${allergy}.allergy`} component={renderInput} label="Allergy" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${allergy}.comment`} optional={true} component={renderInput} label="Comment" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${allergy}.critical`} options={yesNoOptions} component={renderRadio} label="Critical?" />
                </div>

                <button
                    className="btn btn-link remove"
                    onClick={e => {
                        e.preventDefault()
                        fields.remove(index)
                    }}
                >
                    <RemoveIcon />
                    Remove
                </button>
            </div>
        ))}
        <button
            className="btn btn-link add"
            onClick={e => {
                e.preventDefault()
                fields.push({})
            }}
        >
            Add allergy
        </button>
    </div>
)

const renderImmunizations = ({ fields, meta: { error, submitFailed } }) => (
    <div className={classnames("attributes", { open: fields.length })}>
        {fields.map((immunization, index) => (
            <div key={immunization} className="form-row">
                <div className="form-group col-sm-4">
                    <Field name={`${immunization}.immunization`} component={renderInput} label="Immunization" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${immunization}.date`} type="date" component={renderInput} label="Date" />
                </div>

                <button
                    className="btn btn-link remove"
                    onClick={e => {
                        e.preventDefault()
                        fields.remove(index)
                    }}
                >
                    <RemoveIcon />
                    Remove
                </button>
            </div>
        ))}
        <button
            className="btn btn-link"
            onClick={e => {
                e.preventDefault()
                fields.push({})
            }}
        >
            Add immunization
        </button>
    </div>
)

const renderChronicDiseases = ({ fields, meta: { error, submitFailed } }) => (
    <div className={classnames("attributes", { open: fields.length })}>
        {fields.map((disease, index) => (
            <div key={disease} className="form-row">
                <div className="form-group col-sm-4">
                    <Field name={`${disease}.disease`} component={renderInput} label="Disease" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${disease}.date`} type="date" component={renderInput} label="Date" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${disease}.medication`} optional={true} component={renderInput} label="Medication" />
                </div>

                <button
                    className="btn btn-link remove"
                    onClick={e => {
                        e.preventDefault()
                        fields.remove(index)
                    }}
                >
                    <RemoveIcon />
                    Remove
                </button>
            </div>
        ))}
        <button
            className="btn btn-link"
            onClick={e => {
                e.preventDefault()
                fields.push({})
            }}
        >
            Add chronic disease
        </button>
    </div>
)

const renderInjuries = ({ fields, meta: { error, submitFailed } }) => (
    <div className={classnames("attributes", { open: fields.length })}>
        {fields.map((injury, index) => (
            <div key={injury} className="form-row">
                <div className="form-group col-sm-4">
                    <Field name={`${injury}.injury`} component={renderInput} label="Injury or handicap" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${injury}.date`} type="date" component={renderInput} label="Date" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${injury}.medication`} optional={true} component={renderInput} label="Prosthetics &amp; aids" />
                </div>

                <button
                    className="btn btn-link remove"
                    onClick={e => {
                        e.preventDefault()
                        fields.remove(index)
                    }}
                >
                    <RemoveIcon />
                    Remove
                </button>
            </div>
        ))}
        <button
            className="btn btn-link"
            onClick={e => {
                e.preventDefault()
                fields.push({})
            }}
        >
            Add injury or handicap
        </button>
    </div>
)

const renderSurgeries = ({ fields, meta: { error, submitFailed } }) => (
    <div className={classnames("attributes", { open: fields.length })}>
        {fields.map((injury, index) => (
            <div key={injury} className="form-row">
                <div className="form-group col-sm-4">
                    <Field name={`${injury}.injury`} component={renderInput} label="Surgery" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${injury}.date`} type="date" component={renderInput} label="Date" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${injury}.medication`} optional={true} component={renderInput} label="Comment" />
                </div>

                <button
                    className="btn btn-link remove"
                    onClick={e => {
                        e.preventDefault()
                        fields.remove(index)
                    }}
                >
                    <RemoveIcon />
                    Remove
                </button>
            </div>
        ))}
        <button
            className="btn btn-link"
            onClick={e => {
                e.preventDefault()
                fields.push({})
            }}
        >
            Add surgery
        </button>
    </div>
)

const renderMedications = ({ fields, meta: { error, submitFailed } }) => (
    <div className={classnames("attributes", { open: fields.length })}>
        {fields.map((medication, index) => (
            <div key={medication} className="form-row">
                <div className="form-group col-sm-4">
                    <Field name={`${medication}.medication`} component={renderInput} label="Additional medication" />
                </div>
                <div className="form-group col-sm-4">
                    <Field name={`${medication}.comment`} optional={true} component={renderInput} label="Comment" />
                </div>

                <button
                    className="btn btn-link remove"
                    onClick={e => {
                        e.preventDefault()
                        fields.remove(index)
                    }}
                >
                    <RemoveIcon />
                    Remove
                </button>
            </div>
        ))}
        <button
            className="btn btn-link"
            onClick={e => {
                e.preventDefault()
                fields.push({})
            }}
        >
            Add additional medication
        </button>
    </div>
)

export { renderMedications, renderSurgeries, renderInjuries, renderChronicDiseases, renderImmunizations, renderAllergies, RenderForm }

Step3 = reduxForm({
    form: "newPatient",
    destroyOnUnmount: false,
    forceUnregisterOnUnmount: true,
    validate
})(Step3)

const selector = formValueSelector("newPatient")
Step3 = connect(
    state => ({
        dateOfBirth: selector(state, "dateOfBirth"),
        codesLoading: state.codes.loading,
        creating: state.patient.creating
    }),
    {
        getCodes: getCodesAsOptions,
        loadCategories: loadCategoriesImport
    }
)(Step3)

export default Step3
