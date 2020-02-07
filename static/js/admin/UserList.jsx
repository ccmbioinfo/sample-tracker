import React from "react";
import Panel from "react-bootstrap/lib/Panel";
import Button from "react-bootstrap/lib/Button";
import Grid from "react-bootstrap/lib/Grid";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Checkbox from "react-bootstrap/lib/Checkbox";
import FormControl from "react-bootstrap/lib/FormControl";
import CreateUserModal from "./CreateUserModal";
import UserRow from "./UserRow";
import ConfirmModal from "./ConfirmModal";
import Alert from "react-bootstrap/lib/Alert";

export default class UserList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userList: [],
            addingUser: false,
            updatingUser: null,
            deletingUser: null,
            message: "",
            messageStatus: ""
        };
        this.showAddingUser = this.showAddingUser.bind(this);
        this.hideAddingUser = this.hideAddingUser.bind(this);
        this.addUser = this.addUser.bind(this);
        this.showUpdatingUser = this.showUpdatingUser.bind(this);
        this.hideUpdatingUser = this.hideUpdatingUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.showDeletingUser = this.showDeletingUser.bind(this);
        this.hideDeletingUser = this.hideDeletingUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.clearMessage = this.clearMessage.bind(this);
    }
    componentDidMount() {
        fetch("/admin/users")
            .then(response => response.json())
            .then(userList => this.setState({ userList }));
    }
    showAddingUser() {
        this.setState({ addingUser: true });
    }
    hideAddingUser() {
        this.setState({ addingUser: false });
    }
    addUser(user) {
        this.setState({
            userList: this.state.userList.concat(user)
        });
        this.hideAddingUser();
    }
    showUpdatingUser(user) {
        this.setState({
            updatingUser: user
        });
    }
    hideUpdatingUser() {
        this.setState({
            updatingUser: null
        });
    }
    updateUser() {
        fetch("/admin/users", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": document.getElementById("csrf_token").value
            },
            body: JSON.stringify(this.state.updatingUser)
        }).then(response => {
            if (response.ok) {
                this.setState({
                    message: `Updated ${this.state.updatingUser.username}.`,
                    messageStatus: "success"
                });
            } else {
                this.setState({
                    message: `Bad request for ${this.state.updatingUser.username}.`,
                    messageStatus: "warning"
                });
            }
            this.hideUpdatingUser();
        });
    }
    showDeletingUser(user) {
        this.setState({
            deletingUser: user
        });
    }
    hideDeletingUser() {
        this.setState({
            deletingUser: null
        });
    }
    deleteUser() {
        fetch("/admin/users", {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": document.getElementById("csrf_token").value
            },
            body: JSON.stringify(this.state.deletingUser)
        }).then(response => {
            if (response.ok) {
                this.setState({
                    message: `Deleted ${this.state.deletingUser.username}.`,
                    messageStatus: "info"
                });
            } else {
                this.setState({
                    message: `Failed to delete ${this.state.deletingUser.username}.`,
                    messageStatus: "warning"
                });
            }
            this.hideDeletingUser();
        });
    }
    clearMessage() {
        this.setState({
            message: ""
        });
    }
    render() {
        return (
            <Panel>
                <CreateUserModal show={!!this.state.addingUser} onHide={this.hideAddingUser} onSuccess={this.addUser} />
                <ConfirmModal show={!!this.state.updatingUser} onHide={this.hideUpdatingUser} onConfirm={this.updateUser}>
                    Update {this.state.updatingUser && this.state.updatingUser.username} and maybe overwrite password?
                </ConfirmModal>
                <ConfirmModal show={!!this.state.deletingUser} onHide={this.hideDeletingUser} onConfirm={this.deleteUser}>
                    Really delete {this.state.deletingUser && this.state.deletingUser.username}?
                </ConfirmModal>
                {this.state.message &&
                <Alert bsStyle={this.state.messageStatus} onDismiss={this.clearMessage}>{this.state.message}</Alert>}
                <Panel.Heading style={{
                    paddingTop: '1em',
                    paddingBottom: '1em',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Panel.Title componentClass="h3">Users</Panel.Title>
                    <Button bsStyle="primary" onClick={this.showAddingUser}>Add new</Button>
                </Panel.Heading>
                <Panel.Body>
                    <Grid fluid>
                        <Row>
                            <Col xs={1}><h4>Username</h4></Col>
                            <Col xs={2}><h4>Email</h4></Col>
                            <Col xs={1}><h4>Admin?</h4></Col>
                            <Col xs={6}><h4>Change password</h4></Col>
                            <Col xs={2}><h4>Actions</h4></Col>
                        </Row>
                        {this.state.userList.map(user =>
                            <UserRow
                                key={user.username} {...user}
                                onUpdate={this.showUpdatingUser} onDelete={this.showDeletingUser} />
                            )}
                    </Grid>
                </Panel.Body>
            </Panel>
        );
    }
}
