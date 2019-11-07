import React from "react";
import { Image,PanelGroup, Radio, Grid, Row, Panel, Form, Button, FormGroup,FormControl,ControlLabel,Checkbox,Col} from 'react-bootstrap';
import {FETCH_COHORT_LIST,ADD_DATASETS_TO_COHORT} from './Url.jsx'; 

export default class CohortModal extends React.Component {

	constructor(props) {
        super(props);
		this.state = {

                cohortList: {},
                selectedDropDownCohort: '',
				inputCohortValue: '',
				buttonDisabled: true
        };
		this.setValue = this.setValue.bind(this);
		this.handleInputCohortChange = this.handleInputCohortChange.bind(this);
        this.addDatasets2Cohort = this.addDatasets2Cohort.bind(this);
        }
	componentDidMount(){

                fetch(FETCH_COHORT_LIST)
                .then((resp) => resp.json())
                .then((data)=> this.setState({cohortList: data}));

        }
	setValue(event){

		this.setState({

			selectedDropDownCohort: event.target.value,
			inputCohortValue: '',
			buttonDisabled: event.target.value.length == 0 ? true : false
		});

	}
	handleInputCohortChange(event){

		 this.setState({

			inputCohortValue: event.target.value,
			selectedDropDownCohort: '',
			buttonDisabled: event.target.value.length < 5 ? true : false
		});

	}
    addDatasets2Cohort(){

         fetch(ADD_DATASETS_TO_COHORT,{

                    method: "post",
                    headers: {

                        'Accept': 'application/json, text/plain, */*', 
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.getElementById('csrf_token').value
                    },
                    body: JSON.stringify({"datasets": this.props.selectedSamples,"add2ExistingCohort": this.state.selectedDropDownCohort,"add2NewCohort":this.state.inputCohortValue})

            })
            .then(response =>response.json())
            .then(data => alert(data.Status)); 
    }
	render(){
	
		return (
		
			<Form>
				<FormGroup controlId="add2ExistingCohort" bsSize="sm">
					<ControlLabel>
						Move participants to an existing cohort
					</ControlLabel>
					<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.setValue} value={this.state.selectedDropDownCohort}>
                                 		<option value=""></option>
                                        	{Object.keys(this.state.cohortList).map( (cohortID) => <option key = {cohortID} value={cohortID} >{this.state.cohortList[cohortID]}</option> )}
					</FormControl>
				</FormGroup>
                { 0 == 1 &&
                <div>
				<p>Or</p>
				<FormGroup controlId="newCohort" bsSize="sm"> 
					<ControlLabel>
						Move to a new cohort (min of 5 characters)
					</ControlLabel>
					<FormControl type="text" value={this.state.inputCohortValue} placeholder="Enter a new Cohort name" onChange= {this.handleInputCohortChange}/>
				</FormGroup>
                </div>
			    }
			<Button disabled={this.state.buttonDisabled} onClick={this.addDatasets2Cohort}>Submit</Button>
			</Form>
			

		);

	}

}
