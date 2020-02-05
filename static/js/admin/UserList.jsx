import React from "react";
import Panel from "react-bootstrap/lib/Panel";
import Button from "react-bootstrap/lib/Button";
import Grid from "react-bootstrap/lib/Grid";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";

export default class UserList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userList: []
        };
    }
    componentDidMount() {
        fetch("/admin/users")
            .then(response => response.json())
            .then(userList => this.setState({ userList }));
    }
    render() {
        return (
            <div>
                <Panel>
                    <Panel.Heading>
                        <Button bsStyle="primary pull-right">Add new</Button>
                        <Panel.Title componentClass="h3">Users</Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <Grid>
                            <Row>
                                <Col xs={2}><h4>Username</h4></Col>
                                <Col xs={2}><h4>Email</h4></Col>
                                <Col xs={1}><h4>Role</h4></Col>
                            </Row>
                            {this.state.userList.map(user => (
                                <Row>
                                    <Col xs={2}>{user.username}</Col>
                                    <Col xs={2}>{user.email}</Col>
                                    <Col xs={1}>{user.accessLevel}</Col>
                                </Row>
                            ))}
                        </Grid>
                    </Panel.Body>
                </Panel>
            </div>
        );
    }
}
