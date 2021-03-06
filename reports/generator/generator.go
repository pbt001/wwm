package generator

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-openapi/strfmt"
	"github.com/pkg/errors"
	"github.com/rs/zerolog"

	"github.com/iryonetwork/wwm/reports"
	"github.com/iryonetwork/wwm/utils"
)

type (
	generator struct {
		storage    reports.Storage
		logger     zerolog.Logger
		codeRegexp *regexp.Regexp
	}
)

const dataKeyCategory = "/category"

const codeRe = `^(.+)::(.+)\|(.+)\|$`

// Generate generates report
func (g *generator) Generate(ctx context.Context, writer ReportWriter, reportSpec ReportSpec, createdAtStart *strfmt.DateTime, createdAtEnd *strfmt.DateTime) (bool, error) {
	if reportSpec.GroupByPatientID {
		return g.generateGroupedByPatientID(ctx, writer, reportSpec, createdAtStart, createdAtEnd)
	}

	files, err := g.storage.Find("", map[string]string{dataKeyCategory: reportSpec.FileCategory}, createdAtStart, createdAtEnd)
	if err != nil {
		return false, errors.Wrapf(err, "failed to fetch files")
	}

	if len(*files) == 0 {
		g.logger.Info().Msg("there are no new files, exit with generating new report")
		return false, nil
	}

	for _, file := range *files {
		var dataMap map[string]interface{}
		if err := json.Unmarshal([]byte(file.Data), &dataMap); err != nil {
			return false, errors.Wrapf(err, "failed to unmarshal file data")
		}

		row := []string{}
		for _, column := range reportSpec.Columns {
			spec, ok := reportSpec.ColumnsSpecs[column]
			if !ok {
				return false, errors.Errorf("could not find a spec for column '%s'", column)
			}
			switch spec.Type {
			case TYPE_FILE_META:
				switch spec.MetaField {
				case META_FIELD_FILE_ID:
					row = append(row, file.FileID)
				case META_FIELD_VERSION:
					row = append(row, file.Version)
				case META_FIELD_PATIENT_ID:
					row = append(row, file.PatientID)
				case META_FIELD_CREATED_AT:
					value, err := formatTimestamp(file.CreatedAt.String(), spec.TimestampFormat)
					if err != nil {
						return false, err
					}
					row = append(row, value)
				case META_FIELD_UPDATED_AT:
					value, err := formatTimestamp(file.UpdatedAt.String(), spec.TimestampFormat)
					if err != nil {
						return false, err
					}
					row = append(row, value)
				}
			default:
				value, _ := g.getComplexValueFromData(spec, []*map[string]interface{}{&dataMap}, "")
				row = append(row, strings.TrimSpace(value))
			}
		}
		err = writer.Write(row)
		if err != nil {
			return false, errors.Wrapf(err, "failed to write report row")
		}
	}

	return true, nil
}

// Generate generates report
func (g *generator) generateGroupedByPatientID(ctx context.Context, writer ReportWriter, reportSpec ReportSpec, createdAtStart *strfmt.DateTime, createdAtEnd *strfmt.DateTime) (bool, error) {
	files, err := g.storage.Find("", map[string]string{dataKeyCategory: reportSpec.FileCategory}, createdAtStart, createdAtEnd)
	if err != nil {
		return false, errors.Wrapf(err, "failed to fetch files")
	}

	if len(*files) == 0 {
		g.logger.Info().Msg("there are no new files, exit with generating new report")
		return false, nil
	}

	patientIdFileIndexMap := make(map[string][]int)
	for fileIndex, file := range *files {
		if _, ok := patientIdFileIndexMap[file.PatientID]; !ok {
			patientIdFileIndexMap[file.PatientID] = []int{fileIndex}

		} else {
			patientIdFileIndexMap[file.PatientID] = append(patientIdFileIndexMap[file.PatientID], fileIndex)
		}
	}

	for _, fileIndexes := range patientIdFileIndexMap {
		var dataMaps []*map[string]interface{}
		var fileIDs []string
		var versions []string
		var createdAts []string
		var updatedAts []string
		patientID := (*files)[fileIndexes[0]].PatientID

		for _, fileIndex := range fileIndexes {
			// unmarshal each file to separate data map
			var dataMap map[string]interface{}
			file := (*files)[fileIndex]

			if err := json.Unmarshal([]byte(file.Data), &dataMap); err != nil {
				return false, errors.Wrapf(err, "failed to unmarshal file data")
			}

			dataMaps = append(dataMaps, &dataMap)

			fileIDs = append(fileIDs, file.FileID)
			versions = append(versions, file.Version)
			if !utils.SliceContains(createdAts, file.CreatedAt.String()) {
				createdAts = append(createdAts, file.CreatedAt.String())
			}
			if !utils.SliceContains(updatedAts, file.UpdatedAt.String()) {
				updatedAts = append(updatedAts, file.UpdatedAt.String())
			}
		}

		row := []string{}
		for _, column := range reportSpec.Columns {
			spec, ok := reportSpec.ColumnsSpecs[column]
			if !ok {
				return false, errors.Errorf("could not find a spec for column '%s'", column)
			}
			switch spec.Type {
			case TYPE_FILE_META:
				switch spec.MetaField {
				case META_FIELD_FILE_ID:
					row = append(row, strings.Join(fileIDs, ", "))
				case META_FIELD_VERSION:
					row = append(row, strings.Join(versions, ", "))
				case META_FIELD_PATIENT_ID:
					row = append(row, patientID)
				case META_FIELD_CREATED_AT:
					var formattedCreatedAts []string
					for _, createdAt := range createdAts {
						value, err := formatTimestamp(createdAt, spec.TimestampFormat)
						if err == nil {
							formattedCreatedAts = append(formattedCreatedAts, value)
						}
					}
					row = append(row, strings.Join(formattedCreatedAts, ", "))
				case META_FIELD_UPDATED_AT:
					var formattedUpdatedAts []string
					for _, createdAt := range updatedAts {
						value, err := formatTimestamp(createdAt, spec.TimestampFormat)
						if err == nil {
							formattedUpdatedAts = append(formattedUpdatedAts, value)
						}
					}
					row = append(row, strings.Join(formattedUpdatedAts, ", "))
				}
			default:
				value, _ := g.getComplexValueFromData(spec, dataMaps, "")
				row = append(row, strings.TrimSpace(value))
			}
		}
		err = writer.Write(row)
		if err != nil {
			return false, errors.Wrapf(err, "failed to write report row")
		}
	}

	return true, nil
}

func (g *generator) getComplexValueFromData(spec ValueSpec, data []*map[string]interface{}, prefix string) (value string, ok bool) {
	found := false
	switch spec.Type {
	case TYPE_ARRAY:
		values := []interface{}{}
		for i := spec.IncludeItems.Start; true; i++ {
			elementFound := false
			elementValues := []interface{}{}

			for _, fieldSpec := range spec.Properties {
				value, valueFound := g.getComplexValueFromData(fieldSpec, data, fmt.Sprintf("%s%s:%d", prefix, spec.EhrPath, i))
				if valueFound {
					elementFound = true
				}
				elementValues = append(elementValues, value)
			}
			if elementFound {
				values = append(values, fmt.Sprintf(spec.Format, elementValues...))
				found = true
			}

			if !elementFound || (spec.IncludeItems.End != -1 && i == spec.IncludeItems.End) {
				break
			}
		}

		value := ""
		for _, v := range values {
			if value == "" {
				value = v.(string)
			} else {
				value = fmt.Sprintf("%s, %s", value, v)
			}
		}

		return value, found
	case TYPE_QUANTITY:
		value, found = g.getSimpleValueFromData(data, fmt.Sprintf("%s%s", prefix, spec.EhrPath))
		if found {
			v := strings.Split(value, ",")
			return fmt.Sprintf("%s %s", v[0], spec.Unit), true
		}
		return value, false
	case TYPE_DATETIME:
		value, found = g.getSimpleValueFromData(data, fmt.Sprintf("%s%s", prefix, spec.EhrPath))
		if found {
			value, err := formatTimestamp(value, spec.TimestampFormat)
			if err != nil {
				return "", false
			}
			return value, true
		}
		return value, false
	case TYPE_CODE:
		return g.getCodeValueFromData(data, fmt.Sprintf("%s%s", prefix, spec.EhrPath))
	default:
		return g.getSimpleValueFromData(data, fmt.Sprintf("%s%s", prefix, spec.EhrPath))
	}
}

func (g *generator) getSimpleValueFromData(data []*map[string]interface{}, fullEhrPath string) (value string, ok bool) {
	// check all data maps for value and collect distinct ones
	values := []string{}
	for _, d := range data {
		if val, ok := (*d)[fullEhrPath]; ok {
			var s string
			switch val.(type) {
			case string:
				s = val.(string)
				if s == "true" {
					s = "Yes"
				} else if s == "false" {
					s = "No"
				}
			case int:
				s = strconv.Itoa(val.(int))
			case float32:
				if float64(val.(float32)) == math.Trunc(float64(val.(float32))) {
					s = strconv.Itoa(int(val.(float32)))
				} else {
					s = strconv.FormatFloat(float64(val.(float32)), 'G', -1, 64)
				}
			case float64:
				s = strconv.FormatFloat(val.(float64), 'G', -1, 64)
			case bool:
				if val == true {
					s = "Yes"
				} else {
					s = "No"
				}
			}

			if s != "" && !utils.SliceContains(values, s) {
				values = append(values, s)
			}
		}
	}

	if len(values) == 0 {
		return "", false
	}

	// if multiple distinct values present, combine them into one string
	return strings.Join(values, ", "), true
}

func (g *generator) getCodeValueFromData(data []*map[string]interface{}, fullEhrPath string) (value string, ok bool) {
	// check all data maps for value and collect distinct ones
	values := []string{}
	for _, d := range data {
		if val, ok := (*d)[fullEhrPath]; ok {
			var s string
			if c, ok := val.(string); ok {
				if g.codeRegexp.MatchString(c) {
					v := strings.Split(c, "|")
					s = v[1]
				} else {
					// return value even if doesn't match code regex to support legacy data with bugs
					s = c
				}
			}
			if s != "" && !utils.SliceContains(values, s) {
				values = append(values, s)
			}
		}
	}

	if len(values) == 0 {
		return "", false
	}

	// if multiple distinct values present, combine them into one string
	return strings.Join(values, ", "), true
}

// New initializes a new instance of generator
func New(storage reports.Storage, logger zerolog.Logger) (*generator, error) {
	codeRegexp, err := regexp.Compile(codeRe)
	if err != nil {
		return nil, err
	}

	s := &generator{
		storage:    storage,
		logger:     logger.With().Str("component", "reports/generator").Logger(),
		codeRegexp: codeRegexp,
	}

	return s, nil
}

func formatTimestamp(timestamp string, format string) (string, error) {
	if _, ok := TIMESTAMP_FORMAT_LAYOUTS[format]; !ok {
		format = TIMESTAMP_FORMAT_DATETIME
	}

	t, err := time.Parse(TIMESTAMP_FORMAT_LAYOUTS[TIMESTAMP_FORMAT_DATETIME], timestamp)
	if err != nil {
		return "", err
	}

	return t.Format(TIMESTAMP_FORMAT_LAYOUTS[format]), nil
}
