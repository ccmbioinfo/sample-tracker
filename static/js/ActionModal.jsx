import React from "react";
import {Modal} from 'react-bootstrap';
import CohortModal from './CohortModal';
import AnalysisStatusModal from './AnalysisStatusModal';
import SolvedStatusModal from  './SolvedStatusModal';
import ReanalysisModal from './ReanalysisModal';
import AssignToModal from './AssignToModal';

export default class ActionModal extends React.Component{

    constructor(props){
        super(props);
	}
    render(){

    return(

        <div>
            <Modal show={true} onHide={this.props.sampleTableReset}>
				<Modal.Header closeButton>
            	    <Modal.Title>
					{

						this.props.actionSelectOptions[this.props.action]

					}
					</Modal.Title>
          		</Modal.Header>
          	    <Modal.Body>

			        {this.props.action == "add2Cohort" && <CohortModal selectedSamples = {this.props.selectedSamples}/>}
			        {this.props.action == "updateAnalysisStatus" && <AnalysisStatusModal selectedSamples = {this.props.selectedSamples} />}
			        {this.props.action == "updateSolvedStatus" && <SolvedStatusModal selectedSamples = {this.props.selectedSamples} />}
                    {this.props.action == "requestReanalysis" && <ReanalysisModal selectedSamples = {this.props.selectedSamples} />}
                    {this.props.action == "assignTo" && <AssignToModal selectedSamples = {this.props.selectedSamples} />}
			    </Modal.Body>
			</Modal>
		</div>
    );
    }
}
