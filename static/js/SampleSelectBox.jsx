import React from "react";
import { PanelGroup, Radio, Grid, Row, Panel, Form, Button, FormGroup,FormControl,ControlLabel,Checkbox,Col} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import '../css/date-picker.css';
import {ANALYSIS_STATUSES, UPLOAD_STATUSES, SOLVED_STATUSES} from './Constants';

export default class SampleSelectBox extends React.Component{
	constructor(props){

		super(props);
		this.state = {
      				startDate: null,
				endDate: null,
				radioDate: 'enteredDate'
   		};
    		this.handleStartDate = this.handleStartDate.bind(this);
		this.handleEndDate = this.handleEndDate.bind(this);
		this.setRadioDate = this.setRadioDate.bind(this);
		this.clearAll = this.clearAll.bind(this);
	}
	setRadioDate(event){
		
		this.setState({

				radioDate: event.target.value

		});
		this.props.fetchSamplesbyDates(event.target.value,this.state.startDate,this.state.endDate);

	}
	handleStartDate(date) {
   		 this.setState({
      			startDate: date
    		});
		this.props.fetchSamplesbyDates(this.state.radioDate,date,this.state.endDate);
  	}
	handleEndDate(date){

		this.setState({

			endDate: date

		});
		this.props.fetchSamplesbyDates(this.state.radioDate,this.state.startDate,date);

	}
	clearAll(){

		 this.setState({
			startDate: null,
			endDate: null,
			radioDate: 'enteredDate'
		});
		this.props.clearSamples();

	}
	render(){
		return(
				<Grid>
				<Row>
					<Col md={6} lg={6} mdOffset={3} lgOffset={3}>	
						<PanelGroup accordion id='search-form-1' defaultActiveKey="5" onSelect={this.clearAll}>
						<Panel bsStyle="primary" eventKey="1">
						<Panel.Heading><Panel.Title toggle>Search by data types and versions</Panel.Title></Panel.Heading>
							<Panel.Body collapsible>
                            <Form>
                                    <FormGroup controlId="assignedToSelect" bsSize="sm">
                                        <ControlLabel>
                                            Assigned to
                                        </ControlLabel>
      								    <FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.props.fetchSamples} value={this.props.formInput.assignedToSelect}>
                                            <option value=""></option>
                                            <option value="ALL">ALL</option>
									        {this.props.uploadUsers.map( (uploadUser,index) => <option key = {index} value={uploadUser} >{uploadUser}</option> )}
                                        </FormControl>
                                    </FormGroup>
									<FormGroup controlId="datasetTypeSelect" bsSize="sm">
										<ControlLabel>
					 						Dataset type
										</ControlLabel>
	                                    <FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.props.fetchSamples} value={this.props.formInput.datasetTypeSelect}>
                                            <option value=""></option>
                                            <option value="ALL">ALL</option>
                                            {this.props.datasetType.map( (proj,index) => <option key = {index} value={proj} >{proj}</option> )}
                                        </FormControl>	
  									</FormGroup>
									<FormGroup controlId="tissueTypeSelect" bsSize="sm">
										<ControlLabel>
					 						Tissue type
										</ControlLabel>
											<FormControl bsSize="sm" type="text" placeholder="Enter tissue name" onChange={this.props.fetchSamples} value={this.props.formInput.tissueTypeSelect}/>
		
  									</FormGroup>
									<FormGroup controlId="pipelineSelect" bsSize="sm">
										<ControlLabel>
					 					    Pipeline version
										</ControlLabel>
											<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.props.fetchSamples} value={this.props.formInput.pipelineSelect} >
                                                <option value=""></option>
                                                {this.props.pipelineVersions.map( (proj,index) => <option key = {index} value={proj} >{proj}</option> )}
                                            </FormControl>
  									</FormGroup>
								</Form>
                            </Panel.Body>
                        </Panel>
						<Panel bsStyle="primary" eventKey="2">
						<Panel.Heading><Panel.Title toggle>Search by sample status</Panel.Title></Panel.Heading>
							<Panel.Body collapsible>
								<Form>
  									<FormGroup controlId="analysisSelect" bsSize="sm">
    										<ControlLabel>
      											Analysis Status
    										</ControlLabel>
										<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.props.fetchSamples} value={this.props.formInput.analysisSelect}>
                                                         				<option value=""></option>
                                                                        {ANALYSIS_STATUSES.map((proj,index) => <option key = {index} value={proj} >{proj}</option> )}
										</FormControl>
									</FormGroup>
									<FormGroup controlId="uploadSelect" bsSize="sm">
										<ControlLabel>
					 						Upload Status
										</ControlLabel>
										<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.props.fetchSamples} value={this.props.formInput.uploadSelect}>
				                                                	<option value=""></option>
                                                                    {UPLOAD_STATUSES.map((proj,index) => <option key = {index} value={proj} >{proj}</option> )}
                                                				</FormControl>
  									</FormGroup>
									<FormGroup controlId="resultSelect" bsSize="sm">
										<ControlLabel>
					 						Result Status
										</ControlLabel>
										<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.props.fetchSamples} value={this.props.formInput.resultSelect}>
				                                                         <option value=""></option>
                                                                          {SOLVED_STATUSES.map((proj,index) => <option key = {index} value={proj} >{proj}</option> )}
                                                				</FormControl>
  									</FormGroup>
									
								</Form>
							</Panel.Body>
						</Panel>
						<Panel bsStyle="primary" eventKey="3">
						<Panel.Heading><Panel.Title toggle>Search by uploader</Panel.Title></Panel.Heading>
							<Panel.Body collapsible>
								<Form>
  									<FormGroup controlId="uploadCenterSelect" bsSize="sm">
    										<ControlLabel>
      											Upload lab/center
    										</ControlLabel>
      											<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.props.fetchSamples} value={this.props.formInput.uploadCenterSelect}>
                                                	 					<option value=""></option>
                                                  	 					<option value="ALL">ALL</option>
												{this.props.uploadCenters.map( (uploadCenter,index) => <option key = {index} value={uploadCenter} >{uploadCenter}</option> )}
                                          						</FormControl>
									</FormGroup>
									<FormGroup controlId="uploadUserSelect" bsSize="sm">
										<ControlLabel>
					 						Uploaded by user
										</ControlLabel>
      											<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.props.fetchSamples} value={this.props.formInput.uploadUserSelect}>
                                                	 					<option value=""></option>
                                                  	 					<option value="ALL">ALL</option>
												{this.props.uploadUsers.map( (uploadUser,index) => <option key = {index} value={uploadUser} >{uploadUser}</option> )}
                                          		</FormControl>
  									</FormGroup>
								</Form>
							</Panel.Body>
						</Panel>
						<Panel bsStyle="primary" eventKey="4">
						<Panel.Heading><Panel.Title toggle>Search by dates</Panel.Title></Panel.Heading>
							<Panel.Body collapsible>
								<Form>
  									<FormGroup controlId="dateTypeSelect" bsSize="sm">
										<Radio name="dateType" value='enteredDate' inline checked={this.state.radioDate == 'enteredDate'} onChange={this.setRadioDate} >Entered date</Radio>
										<Radio name="dateType" value='analysisDate' inline checked={this.state.radioDate == 'analysisDate'} onChange={this.setRadioDate} >Analyzed date</Radio>
									</FormGroup>
									<FormGroup controlId="fromdateSelect">
										<ControlLabel>
											From
										</ControlLabel>
										<DatePicker showYearDropdown showMonthDropdown isClearable={true} selected={this.state.startDate} onChange={this.handleStartDate}/>
  									</FormGroup>
									<FormGroup controlId="todateSelect">
										<ControlLabel>
											To
										</ControlLabel>
										<DatePicker showYearDropdown showMonthDropdown  isClearable={true} selected={this.state.endDate} onChange={this.handleEndDate}/>
  									</FormGroup>
									
								</Form>
							</Panel.Body>
						</Panel>
						<Panel bsStyle="primary" eventKey="5">
						<Panel.Heading><Panel.Title toggle>Search by identifiers</Panel.Title></Panel.Heading>
							<Panel.Body collapsible>
								<Form>
  									<FormGroup controlId="cohortSelect" bsSize="sm">
    										<ControlLabel>
      											Cohort
    										</ControlLabel>
      											<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.props.fetchSamples} value={this.props.formInput.cohortSelect}>
                                                	 					<option value=""></option>
                                                  	 					<option value="ALL">ALL</option>
                                                 						{this.props.projects.map( (proj,index) => <option key = {index} value={proj} >{proj}</option> )}
                                          						</FormControl>
									</FormGroup>
									
                                    <FormGroup controlId="familySelect" bsSize="sm">
                                        <ControlLabel>
                                            Family ID(s) - multiple values separated by ','
                                        </ControlLabel>
                                    <FormControl componentClass="textarea" placeholder="Enter Family ID(s) (min 3 characters per ID)" onChange={this.props.fetchSamples} value={this.props.formInput.familySelect}/>
                                    </FormGroup>
									<FormGroup controlId="sampleSelect" bsSize="sm">
										<ControlLabel>
					 						Sample Name(s) - multiple values separated by ',' 
										</ControlLabel>
											<FormControl componentClass="textarea" placeholder="Enter Sample Name(s) (min 3 characters per name)" onChange={this.props.fetchSamples} value={this.props.formInput.sampleSelect}/>
  									</FormGroup>
                                </Form>
							</Panel.Body>
						</Panel>
						</PanelGroup>
					</Col>
				</Row>
				</Grid>
		);

	}

}
