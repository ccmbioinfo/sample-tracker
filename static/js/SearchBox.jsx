import React from "react";
import SampleSelectBox from "./SampleSelectBox";
import SampleTable from "./SampleTable";
import ProjectStats from "./ProjectStats";
import { Glyphicon, Panel, Grid, Row, Col,Jumbotron,Button } from 'react-bootstrap';
import {FETCH_PIPELINE_VERSIONS, FETCH_DATASET_TYPE, FETCH_COHORT_LIST, SEARCH_COHORT, FETCH_STATS, SEARCH_COHORT_BY_DATE, FETCH_UPLOAD_CENTER_LIST, FETCH_UPLOAD_USER_LIST } from "./Url.jsx";
import {DATASET_TYPES} from "./Constants.jsx";

// values for frominputs object must match FromGroup ControlIds in SampleSelectBox Component
export const forminputs = {
				cohortSelect: '',
                sampleSelect: '',
                assignedToSelect: '',
                datasetTypeSelect: '',
                tissueTypeSelect: '',
				familySelect: '',
                analysisSelect: '',
				uploadSelect:'',
				uploadCenterSelect:'',
				uploadUserSelect:'',
				resultSelect: '',
                pipelineSelect: ''
				
};	
export default class SearchBox extends React.Component{

	constructor(props) {
		super(props);
	  	this.fetchSamples = this.fetchSamples.bind(this);
		this.fetchSamplesbyDates = this.fetchSamplesbyDates.bind(this);
		this.setforminput = this.setforminput.bind(this);
		this.resetSampleState = this.resetSampleState.bind(this);
		this.state = { 
				projects : [],
				uploadCenters: [],
                datasetType : [],
				uploadUsers: [],
				samples : [],
				projStats:[],
				selectedTime: (new Date).getTime(),
				forminput: forminputs,
                formEvent: '',
                noSampleStr: 'No samples',
                pipelineVersions: []
		};
	}
	componentDidMount(){

		fetch(FETCH_COHORT_LIST)
  		.then((resp) => resp.json())
		.then((data)=> this.setState({projects: Object.values(data)}) );

		fetch(FETCH_UPLOAD_CENTER_LIST)
                .then((resp) => resp.json())
                .then((data)=> this.setState({uploadCenters: data}));

		
		fetch(FETCH_UPLOAD_USER_LIST)
                .then((resp) => resp.json())
                .then((data)=> this.setState({uploadUsers: data}));

		fetch(FETCH_DATASET_TYPE)
                .then((resp) => resp.json())
                .then((data)=> this.setState({datasetType: data}));
        fetch(FETCH_PIPELINE_VERSIONS)
                .then((resp) => resp.json())
                .then((data)=> this.setState({pipelineVersions: data}));        

    }
	resetSampleState(){

		this.setState({
		
			samples: [],
            noSampleStr:'No samples'

		});
		this.setforminput('','');
	}
	setforminput(formID,formValue){

		let tmpFormObj = {};
		Object.keys(forminputs).forEach(
                                    (key) => {
								        if(formID == key){ 
									
									        tmpFormObj[key] = formValue;
							    	    }
								        else{

										    tmpFormObj[key] = "";
								        }
							        } 
		);
		this.setState({ 
			forminput: tmpFormObj
        });
		this.setState({

			selectedTime: (new Date).getTime()

		});

	}
	fetchSamples(event){

        this.setState({samples: [], noSampleStr: 'Loading....'});
		this.setforminput(event.target.id,event.target.value);
		if(event.target.value.length ==0){

			this.setState({

				samples: [],
                noSampleStr:'No samples'
			});

		}
		else{

			fetch(SEARCH_COHORT+"/"+event.target.id+"/"+event.target.value)
			.then((resp) => resp.json())
			.then((data) =>
					{

					
						if(Object.keys(data).length >0){

							this.setState({
								samples: data,
                                formEvent: event
						     	});
						}
	
						else{

							this.setState({ samples : [], noSampleStr:'No samples' });
						}
				}
				
		 	);

		}
	}
	fetchSamplesbyDates(dateField, startDate, endDate){

		this.setforminput('','');
        this.setState({samples: [], noSampleStr: 'Loading....'});		
		if(startDate === null){
		
			startDate = 0

		}
		if(endDate === null){

			endDate = 0
		}
		if(startDate == 0 && endDate == 0){

			this.setState({

				samples: [],
                noSampleStr:'No samples'
			});
		}	
		else{

			fetch(SEARCH_COHORT_BY_DATE+"/"+dateField+"/"+startDate+"/"+endDate)
			.then((resp) => resp.json())
			.then((data) =>
					{

					
						if(Object.keys(data).length >0){

							this.setState({
								samples: data
						     	});
						}
	
						else{

							this.setState({ samples : [], noSampleStr:'No samples' });
						}
				}
				
		 	);

		}
	}
	render(){

		return(
			<div>
			<SampleSelectBox clearSamples={this.resetSampleState} projects = {this.state.projects} pipelineVersions={this.state.pipelineVersions} datasetType={DATASET_TYPES} uploadCenters={this.state.uploadCenters} uploadUsers ={this.state.uploadUsers} formInput = {this.state.forminput} fetchSamples={this.fetchSamples} fetchSamplesbyDates={this.fetchSamplesbyDates} />
			<Panel bsStyle="primary" id='results-table-1' defaultExpanded>
			<Panel.Heading>
				<Panel.Title toggle>
					Search Results
				</Panel.Title>
			</Panel.Heading>
			<Panel.Collapse>
			<Panel.Body>
			<SampleTable noSampleStr={this.state.noSampleStr}  samples = {this.state.samples} selectedTime= {this.state.selectedTime}  /*columns = {this.state.columns}*/ />
			</Panel.Body>
			</Panel.Collapse>
			</Panel>
			</div>
		);

	}

}
