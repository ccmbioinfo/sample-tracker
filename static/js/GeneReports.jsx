import React, { Fragment} from 'react';
import {Typeahead} from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import {Form, Checkbox, ControlLabel, Button, InputGroup, Alert} from 'react-bootstrap';
import {FETCH_GENE_LIST, FETCH_GENE_DB_VERSION, DOWNLOAD_GENE_REPORT} from './Url.jsx';
import {saveAs} from 'file-saver';

export default class GeneReports extends React.Component {

    constructor(props) {
        super(props);

        this.fetchReports = this.fetchReports.bind(this)
        this.username = this.props.username;

        this.state = {
          GENE_DB_VERSION: "",
          combinedReport: false,
          sampleWise: true,
          variantWise: true,
          geneNames: [],
          selectedGenes: [],
          errMsg: "",
          showErrMsg: false,
        };
    }

    componentDidMount() {
      fetch(FETCH_GENE_DB_VERSION)
      .then((resp) => resp.json())
      .then((data) => {
        this.setState({GENE_DB_VERSION: data});
      });

      fetch(FETCH_GENE_LIST)
      .then((resp) => resp.json())
      .then((data) => {
        this.setState({geneNames: data});
      });
    }

    fetchReports() {
      if (this.state.selectedGenes.length == 0) {
        this.setState({errMsg: "Pick some genes for the report!"});
        this.setState({showErrMsg: true});
        return;
      }

      if (!this.state.variantWise & !this.state.sampleWise) {
        this.setState({errMsg: "Select atleast one type of report: Sample Wise, Variant Wise or both."});
        this.setState({showErrMsg: true});
        return;
      }

      const numberOfGenes = this.state.selectedGenes.length;

      fetch(DOWNLOAD_GENE_REPORT, {
        method: "POST",
        body: JSON.stringify({
          "report_types": [this.state.sampleWise, this.state.variantWise],
          "gene_list": this.state.selectedGenes,
          "combined_report": this.state.combinedReport,
          "username": this.username,
        }),
        headers: {
          'Accept': 'application/gzip',
          'Content-Type': 'application/json',
          'X-CSRFToken': document.getElementById('csrf_token').value,
        },
        responseType: 'blob',
      })
      .then((resp) => resp.blob())
      .then((blob) => {

        const fileName = this.state.GENE_DB_VERSION + ".wes.snv." + numberOfGenes + ".gene.export.zip";
        saveAs(blob, fileName);
      });

      this.setState({selectedGenes : []});
      this.typeahead.getInstance().clear();
    }

    render() {
        return (
              <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: "80%"}}>
                <Fragment>
                  <ControlLabel>Database Version: {this.state.GENE_DB_VERSION}</ControlLabel>
                  <InputGroup>
                    <Typeahead
                      labelKey="name"
                      multiple={true}
                      options={this.state.geneNames}
                      placeholder="Enter a gene name i.e. DMD"
                      id="geneSearchBar"
                      ref={(typeahead) => this.typeahead = typeahead}
                      onChange={(selected) => {
                        this.setState({selectedGenes : selected}); 
                        this.setState({showErrMsg: false});
                      }}/>
                    <InputGroup.Button>
                      <Button 
                      type="submit"
                      onClick={this.fetchReports}>
                        Fetch reports
                      </Button>
                    </InputGroup.Button>
                  </InputGroup>
                  <Form>
                    <Checkbox inline
                      checked={this.state.combinedReport}
                      onChange={(e) => this.setState({combinedReport: e.target.checked})}
                      style={{float: "left"}}>
                      Combined report
                    </Checkbox>
                    <Checkbox inline
                      checked={this.state.sampleWise}
                      onChange={(e) => this.setState({sampleWise: e.target.checked})}
                      style={{float: "right"}}>
                      Sample Wise report
                    </Checkbox>
                    <Checkbox inline
                      checked={this.state.variantWise}
                      onChange={(e) => this.setState({variantWise: e.target.checked})}
                      style={{float: "right"}}>
                      Variant Wise report
                    </Checkbox>
                  </Form>
                </Fragment>

                {this.state.showErrMsg &&
                  <Alert bsStyle="warning" style={{marginTop: "30px"}} 
                  onDismiss={() => this.setState({showErrMsg: false})}>
                    <p>
                      {this.state.errMsg}
                    </p>
                  </Alert>
                }
              </div>
        );
    }
} 