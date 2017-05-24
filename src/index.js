import React from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';
import './index.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

const config = {  
  apiKey: "AIzaSyCwhYInG6uhOn92Zf8QECaFIcGh7vMlvhg",
  authDomain: "questionbowl.firebaseapp.com",
  databaseURL: "https://questionbowl.firebaseio.com"
};

const fb_db = firebase  
  .initializeApp(config)
  .database();

class FormInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: '',
      prompt: 'What is your group name?',
      groupSubmitted: false
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.state.groupSubmitted) {
      this.props.onQuestionSubmit(this.state.input);
    } else {
      this.props.onGroupSubmit(this.state.input);
      this.setState({
        prompt: 'What do you want to know?',
        groupSubmitted: true
      })
    }
    this.setState({input: ''})
  }

  render() {
    return (
      <div className="prompt">
        <h3>{this.state.prompt}</h3>      
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <input type="text"
              className="form-control input-form"
              value={this.state.input}
              onChange={(event) => this.setState({ input: event.target.value })}
              required />
            <button type="submit" className="btn btn-success">Submit</button>
          </div>
        </form>
      </div>
    );
  }
}

const GameHeader = (props) => {
  if (props.groupName === '') {
    return <div></div>;
  } else {
    return (
      <div className="game-header well">
        <h4 className="group">Group: {props.groupName}</h4>
        <h4 className="count">Count: {props.counter}</h4>
      </div>
    );
  }
}

class Game extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			groupName: '',
      counter: 0,
      currentQuestion: ''
		};
    this.handleGroupSubmit = this.handleGroupSubmit.bind(this);
    this.handleQuestionSubmit = this.handleQuestionSubmit.bind(this);
    this.updateCounter = this.updateCounter.bind(this);
    this.getNextQuestion = this.getNextQuestion.bind(this);
	}

  updateCounter() {
    const groupRef = fb_db.ref(`groups/${this.state.groupName}`);
    groupRef.once("value").then( (snapshot) => {
      this.setState({counter: snapshot.child("count").val()});
    });
  }

  handleGroupSubmit(value) {
    this.setState({ groupName: value });
    let groupNameExists;
    const groupsRef = fb_db.ref("groups/");
    fb_db.ref("groups/").once("value")
      .then( (snapshot) => {
        groupNameExists = snapshot.child(value).exists();
        if (groupNameExists) {
          this.setState({counter: snapshot.child(value).child("count").val()});
        } else {
          const group = {}
          group[value] = {count: 0}
          groupsRef.update(group)
        }
      });
    const questionsRef = fb_db.ref(`groups/${value}/questions`);
    questionsRef.on('child_added', (snapshot) => {
      this.updateCounter();
    });
    questionsRef.on('child_removed', (snapshot) => {
      this.setState({currentQuestion: snapshot.val()});
      this.updateCounter();
    });
  };

  handleQuestionSubmit(value) {
    const questionsRef = fb_db.ref(`groups/${this.state.groupName}/questions/`);
    const groupRef = fb_db.ref(`groups/${this.state.groupName}`);
    questionsRef.push(value);
    questionsRef.once("value").then( (snapshot) => {
      groupRef.update({count: snapshot.numChildren()});
    });
  };

  getNextQuestion(){
    const questionsRef = fb_db.ref(`groups/${this.state.groupName}/questions/`);
    const groupRef = fb_db.ref(`groups/${this.state.groupName}`);
    questionsRef.once('value').then( (snapshot) => {
      const key = pickRandomProperty(snapshot.val());
      questionsRef.child(key).remove();
      groupRef.update({count: snapshot.numChildren()-1});
    });
    
  }

  render() {
    return (
      <div>
        <GameHeader
          groupName={this.state.groupName}
          counter={this.state.counter}
        />
        <div className="next-q">
          <h4>{this.state.currentQuestion}</h4>
          {this.state.counter > 0 ? <button className="btn btn-warning" onClick={this.getNextQuestion}>Next Q</button> : ''}
        </div>
        <FormInput
          onGroupSubmit={this.handleGroupSubmit}
          onQuestionSubmit={this.handleQuestionSubmit}
        />
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);


function pickRandomProperty(obj) {
  let result;
  let count = 0;

  for (let prop in obj)
    if (Math.random() < 1/++count)
      result = prop;
  return result;
} 