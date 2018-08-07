import React from "react"
import { Link } from "react-router-dom"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import moment from "moment"
import _ from "lodash"
import fileDownload from "js-file-download"

import { loadReportsByType, readFile } from "../../modules/reports"

class Reports extends React.Component {
    constructor(props) {
        super(props)
        this.state = { loading: true }
    }

    componentDidMount() {
        console.log(this.props)
        if (!this.props.reports) {
            this.props.loadReportsByType(this.props.reportType)
        }
        this.determineState(this.props)
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.reports && !nextProps.reportsLoading) {
            this.props.loadReportsByType(nextProps.reportType)
        }

        this.determineState(nextProps)
    }

    determineState(props) {
        let loading = !props.reports || props.reportsLoading
        this.setState({ loading: loading })
    }

    downloadFile(index) {
        return e => {
            e.preventDefault()
            this.props.readFile(this.props.reportType, this.props.reports[index].name).then(data => {
                let name = this.props.reportType + " ("
                name = name + (this.props.dataSinceInTitle ? moment(this.props.reports[index].dataSince).format("DD-MM-YYYY HH:mm:ss") + " - " : "")
                name = name + moment(this.props.reports[index].dataUntil).format("DD-MM-YYYY HH:mm:ss") + ").csv"
                fileDownload(data, name)
            })
        }
    }

    render() {
        let props = this.props
        if (props.forbidden) {
            return null
        }
        if (this.state.loading) {
            return <div>Loading...</div>
        }
        return (
            <table className="table table-hover text-center">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Report period</th>
                    </tr>
                </thead>
                <tbody>
                    {_.map(props.reports, (report, index) => (
                        <tr key={report.name}>
                            <th scope="row">{index + 1}</th>
                            <td>
                                <Link to="/" onClick={this.downloadFile(index)}>
                                    {props.dataSinceInTitle ? <span>{moment(report.dataSince).format("DD-MM-YYYY HH:mm:ss") + " - "}</span> : null}
                                    <span>{moment(report.dataUntil).format("DD-MM-YYYY HH:mm:ss")}</span>
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    console.log(state.reports)
    return {
        reports: _.get(state.reports.reports, ownProps.reportType, undefined),
        reportsLoading: state.reports.loading,
        forbidden: state.reports.forbidden
    }
}

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            loadReportsByType,
            readFile
        },
        dispatch
    )

export default connect(mapStateToProps, mapDispatchToProps)(Reports)
