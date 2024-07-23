import { BrowserRouter as Router, Route } from 'react-router-dom';
import Register from './components/Register';
    
import Chat from './components/Chat';
import Login from './components/Login';

const App = () => {
    return (
        <Router>
            <Route path="/" component={Chat} exact />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />

        </Router>
    );
};

export default App;
