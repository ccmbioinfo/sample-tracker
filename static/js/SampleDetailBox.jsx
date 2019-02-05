import React from "react";
import {PanelGroup,Panel} from 'react-bootstrap';
import {FETCH_FAMILY_INFO, FETCH_DATASETS} from './Url.jsx';

const reducedFont = {fontSize: "0.75em"}
export default class SampleDetailBox extends React.Component{

	constructor(props){
		
		super(props);
		this.state= {

				family: {
						"probands":[],
						"parents":[]
					},
				datasets:[],
				uploaderInfo: []

		};
	}
	componentDidMount(){
	
		fetch(FETCH_FAMILY_INFO +"/"+this.props.sampleData.FamilyID)
                .then((resp) => resp.json())
                .then((data)=> this.setState({

			family: data

		}));
		fetch(FETCH_DATASETS +"/"+this.props.sampleData.SampleID)
		.then((resp) => resp.json())
		.then((data)=> this.setState({

			datasets: data

		}));

	}
	render(){

		return (

			<div>
			<Panel id="sample-details-panel" defaultExpanded>
				<Panel.Heading><Panel.Title toggle>Family details</Panel.Title></Panel.Heading>
				<Panel.Body collapsible>
					<ul>
						<li key="Sample"><b>Sample</b>: {this.props.sampleData.Sample}</li>
						<li key="familyID"><b>Family ID</b> : {this.props.sampleData.FamilyID}</li>
						<li key="probands"><b>Proband(s)</b> : {this.state.family.probands.map((proband) => proband.Sample).join(", ")}</li>
						<li key="parents"><b>Parent(s)</b> : {this.state.family.parents.map((proband) => proband.Sample).join(", ")}</li>
					</ul>
				</Panel.Body>
			</Panel>
			
			{ this.state.datasets.map ( (dataset) => {

								return( 
									<Panel id={"dataset"+dataset.DatasetID}>
									<Panel.Heading><Panel.Title toggle>{dataset.DatasetType} Dataset</Panel.Title></Panel.Heading>
									<Panel.Body collapsible>
										<ul>
											<li><b>Type</b>: {dataset.DatasetType}</li>
											<li><b>Cohorts this dataset belongs to</b>: {dataset.Cohorts.join(", ")}</li>
											<li><b>Upload date</b>: {dataset.UploadDate}</li>
											<li><b>Upload status</b>: {dataset.UploadStatus}</li>
											<li><b>Upload center</b>: {dataset.UploadCenter}</li>
											<li><b>Upload user</b>: {dataset.UploadUser}</li>
											<li><b>HPF path</b>: <div style={reducedFont}>{dataset.HPFPath}</div></li>
											<li><b>Input file</b>: <div style={reducedFont}>{dataset.InputFile}</div></li>
											<li><b>Run ID</b>: {dataset.RunID}</li>
											<li><b>Solved status</b>: {dataset.SolvedStatus}</li>
                                            <li><b>Notes</b>:{dataset.Notes}</li>                                            
										</ul>
                                        <p><b style={{textDecoration:"underline"}}> Analyses details</b> (from latest to oldest)</p>
                                        { 
                                            Object.keys(dataset.Analyses).map((analysisID,index) =>{
                                                                                            return (
                                                                                                <ul>
                                                                                                     <li> <b>Analysis {index +1} </b></li>
                                                                                                     <ul> 
                                                                                                        <li> <b>Pipeline Version</b>: {dataset.Analyses[analysisID].PipelineVersion}</li>
                                                                                                        <li> <b>History</b>: </li>
                                                                                                            <ul>
                                                                                                                {dataset.Analyses[analysisID].history.map((statArray) => <li><b>{statArray[0]}</b> on {statArray[1]}, <b>comments:</b> {statArray[3]}</li>)}
                                                                                                            </ul>
                                                                                                        <li> <b>Results Directory</b>: <div style={reducedFont}>{dataset.Analyses[analysisID].ResultsDirectory}</div></li>
                                                                                                        <li> <b>Results BAM</b>: <div style={reducedFont}>{dataset.Analyses[analysisID].ResultsBAM}</div></li>
                                                                                                    </ul>
                                                                                                </ul>
                                                                                            );
                                                                               }
                                                                )
                                        }
									</Panel.Body>
									</Panel>
								);
							}
						)
			}
			</div>
								
		);

	}
	

}
