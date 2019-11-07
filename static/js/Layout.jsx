import React from "react";
import SearchBox from "./SearchBox";
import SampleUploader from "./SampleUploader";
import CohortStats from "./CohortStats";
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import {Link, Route, Redirect} from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap';
import {GET_LOGGED_USER, LOGOUT} from './Url.jsx';

export default class Layout extends React.Component{

	constructor(props) {
		super(props);
		this.state = {

				username: ""

			     };
        this.logout = this.logout.bind(this);
	}
	componentDidMount(){

		fetch(GET_LOGGED_USER)
		.then((resp) => resp.json())
		.then((data) => {

					this.setState({ username: data.username});
			
				}
			);

	}
    logout(){

        window.location.replace(LOGOUT);
    }
	render() {
	return (

		 <div>
    			<Navbar inverse>
  				<Navbar.Header>
    					<Navbar.Brand>
      						<a href="/index">Sample-Tracker</a>
  					</Navbar.Brand>
  				</Navbar.Header>
  				<Nav>
                    
                        <LinkContainer to="/CohortStats">
    					    <NavItem eventKey={1}>
      						    Dashboard
    					    </NavItem>
                        </LinkContainer>
    					<LinkContainer to="/SearchBox">
    						<NavItem eventKey={2} >
      							Search Participants
    						</NavItem>
    					</LinkContainer>
                        <LinkContainer to="/SampleUploader">
    					    <NavItem eventKey={3}>
      						    Upload new participants
    					    </NavItem>
                        </LinkContainer>
    			</Nav>
                <Nav pullRight>
    					<NavItem eventKey={4}  onClick={this.logout}>
        					Log out
    					</NavItem>
  				</Nav>
                <Navbar.Text pullRight>Welcome, {this.state.username}</Navbar.Text>
			</Navbar>
            <input type='hidden' id='csrf_token' value={this.props.csrfValue} />
			<div>
				<Route exact path="/index" render={() => (
					<Redirect to="/CohortStats"/>
     				)}/>
				<Route path="/SearchBox" component={SearchBox}/>
                <Route path = "/CohortStats" component={CohortStats}/>
                <Route path="/SampleUploader" component={SampleUploader}/>  
  			</div>
  		</div>

    );
  }

}
