**MERN Task Management App with Role-Based Access**

In this guide, we will create a simple task management app using Node.js (Express) and MongoDB. The application will have multiple roles (admin, moderator, user), each with its own set of permissions.

**Database Schema**
```javascript
// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['admin', 'moderator', 'user'], default: 'user' }
});

module.exports = mongoose.model('User', UserSchema);
```

```javascript
// models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: Date,
  completed: Boolean
});

module.exports = mongoose.model('Task', TaskSchema);
```

**Role-Based Access Control**
```javascript
// controllers/role.js
const User = require('../models/User');
const Task = require('../models/Task');

class RoleController {
  async getAllRoles(req, res) {
    const roles = await User.find({}).select(['name', 'email', 'role']);
    return res.json(roles);
  }

  async createRole(req, res) {
    const role = new User({ name: req.body.name, email: req.body.email, password: req.body.password });
    await role.save();
    return res.json(role);
  }
}

module.exports = RoleController;
```

```javascript
// controllers/task.js
const Task = require('../models/Task');

class TaskController {
  async getAllTasks(req, res) {
    const tasks = await Task.find({}).select(['title', 'description', 'dueDate', 'completed']);
    return res.json(tasks);
  }

  async createTask(req, res) {
    const task = new Task({
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate
    });
    await task.save();
    return res.json(task);
  }
}

module.exports = TaskController;
```

```javascript
// middleware/auth.js
const User = require('../models/User');

async function authenticate(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ msg: 'No token provided' });
  try {
    const decoded = await User.verifyToken(token);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ msg: 'Invalid Token' });
  }
}

module.exports = authenticate;
```

```javascript
// middleware/role.js
const RoleController = require('./role');

async function authorize(req, res, next) {
  const userRole = await User.findById(req.user._id).select(['role']);
  const rolePermissions = RoleController.getPermissions(userRole[0].role);
  if (!rolePermissions.includes('admin') && req.method === 'POST' || !rolePermissions.includes('moderator') && req.body.title !== null) {
    return res.status(403).json({ msg: 'Forbidden' });
  }
  next();
}

module.exports = authorize;
```

```javascript
// role.js
class RoleController {
  static getPermissions(role) {
    switch (role) {
      case 'admin':
        return ['all'];
      case 'moderator':
        return ['create', 'read'];
      default:
        return [];
    }
  }

  static verifyToken(token) {
    // Implement your own token verification logic here
  }
}

module.exports = RoleController;
```

**Express App**
```javascript
// app.js
const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('./middleware/auth');
const roleMiddleware = require('./middleware/role');

const app = express();

app.use(express.json());

app.post('/register', async (req, res) => {
  await authMiddleware(req, res);
  const user = new User({ name: req.body.name, email: req.body.email, password: req.body.password });
  await user.save();
  return res.json(user);
});

app.get('/tasks', async (req, res) => {
  await roleMiddleware(req, res);
  const tasks = await Task.find({});
  return res.json(tasks);
});

app.post('/task', async (req, res) => {
  await authMiddleware(req, res);
  await roleMiddleware(req, res);
  const task = new Task({
    title: req.body.title,
    description: req.body.description
  });
  await task.save();
  return res.json(task);
});

app.listen(3000, () => console.log('Server listening on port 3000'));
```

This is a basic example of how you can create a role-based access control system using MERN stack. You need to implement your own token verification logic in the `verifyToken` function and also handle errors and edge cases properly.

**Note**: This is a simplified example, in a real-world scenario, you would want to use a library like passport.js for authentication and authorization.

Please note that this code is not production-ready. You should always validate user input and implement proper error handling.