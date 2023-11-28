var express = require('express');
var bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const csrf = require('csurf');
var path = require('path');
var port = 3000;
var app = express();
const serviceAccount = require('./serviceAccountKey.json');
const { write } = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://gfial-50251.firebaseio.com',
});

const csrfMiddleware = csrf({ cookie: true });

// view Engine
app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// app.use(express.static(path.join(__dirname, 'public')));

/*
  New code
*/
app.use('/static', express.static(__dirname + '/static'));

// body parser middleware
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

app.use(cookieParser());

app.post('/clientsidedata', async (req, res) => {
  // // receive form parameter
  // // let userobj = {
  // //   Email : req.body.email,
  // //   Role :  req.body.gfRole,
  // //   Name :  req.body.name,
  // //   Organisation : 'MUJ'
  // // }
  // Just a try

  // const actionCodeSettings = {
  //   // URL you want to redirect back to. The domain (www.example.com) for
  //   // this URL must be whitelisted in the Firebase Console.
  //   url: 'https://localhost:3000/gflogin',
  //   // This must be true for email link sign-in.
  //   handleCodeInApp: true
  // };

  // console.log(req.body.email);
  // admin.auth().generateEmailVerificationLink(req.body.email, actionCodeSettings).then((verifylink)=>{
  //     if(verifylink) {
  //       console.log('Verification link created successfully! '+ verifylink.toString());
  //       return sendCustomVerificationEmail(req.body.email, "Anurag", verifylink);
  //     }
  // }).catch((err)=> {
  //   console.log('Error in verificaion: '+ err.toString())
  // })
  var db = admin.database();
  var ref = db.ref('gfRoles');
  var newPostRef = ref.push();

  try {
    // register a user
    // await newPostRef.set(JSON.stringify(userobj));
    console.log('Emaild : ' + req.body.email);
    var remail = req.body.email;
    var rrole = req.body.gfRole;
    var rname = req.body.name;
    await newPostRef.set({ Email: remail, Role: rrole, Name: rname });
  } catch {
    console.log('User has failed to register');
  }

  // create authentication user
  let authuserobj = {
    email: req.body.email,
    password: req.body.password[0],
  };
  console.log(authuserobj);
  admin
    .auth()
    .createUser(authuserobj)
    .then(function (userRecord) {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log('Successfully created new user:', userRecord.uid);
    })
    .catch(function (error) {
      console.log('Error creating new user:', error);
    });
  res.redirect('/');
});

var projects = [
  {
    id: 1,
    img: 'https://picsum.photos/500/300/?image=10',
    name: 'Blinders Glass',
    description:
      'Next, you need to convert your static HTML files into dynamic EJS ones and in the way EJS expects.',
    budget: 20000,
    date: '18th Sept, 2020',
    skill: 'IOT, Machine Learning, Networks',
    proposals: 10,
  },
  {
    id: 2,
    img: 'https://picsum.photos/500/300/?image=5',
    name: 'GFIAL website',
    description:
      'Next, you need to convert your static HTML files into dynamic EJS ones and in the way EJS expects.',
    budget: 10000,
    date: '15 November, 2019',
    skill: 'Front end web dev',
    proposals: 10,
  },
  {
    id: 3,
    img: 'https://picsum.photos/500/300/?image=11',
    name: 'Node js App',
    description:
      'Next, you need to convert your static HTML files into dynamic EJS ones and in the way EJS expects.',
    budget: 5000,
    date: '20th December, 2019',
    skill: 'JavaScript, Node',
    proposals: 10,
  },
];

app.use(csrfMiddleware);

app.all('*', (req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});

app.get('/', (req, res) => {
  res.render('pages/index');
});

// new
app.get('/login', function (req, res) {
  res.render('pages/login');
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.get('/gflogin', function (req, res) {
  const sessionCookie = req.cookies.session || '';
  // console.log(req.cookies)
  console.log('inside gflogin');
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true)
    .then(() => {
      console.log('render dashboard');
      var db = admin.database();
      var ref = db.ref('gfRoles');
      console.log(req.cookies.Gfmail);
      ref
        .orderByChild('Email')
        .equalTo(req.cookies.Gfmail)
        .on('value', (data) => {
          console.log(data.key);
          console.log(data.val());
          var userDatabase = data.val();
          if (!userDatabase) {
            // res.render("dashboard", {userobj: {Name:req.cookies.Gfmail, Role:'undefined'}});
            res.render('pages/dashboard', {
              projects: projects,
              userobj: {
                Name: req.cookies.Gfmail,
                Role: 'undefined',
                Email: 'anurag@gmail.com',
              },
            });
            return;
          }
          console.log(Object.values(userDatabase)[0].Role);
          // res.render("dashboard", {userobj: {Name:req.cookies.Gfmail, Role:Object.values(userDatabase)[0].Role}});
          res.render('pages/dashboard', {
            projects: projects,
            //userobj: {Name:req.cookies.Gfmail, Role:Object.values(userDatabase)[0].Role, Email: 'anurag@gmail.com'}
            userobj: {
              Name: Object.values(userDatabase)[0].Name,
              Role: Object.values(userDatabase)[0].Role,
              Email: Object.values(userDatabase)[0].Email,
            },
          });
        });
    })
    .catch((error) => {
      console.log('Error inside Gflogin route');
      res.redirect('/login');
      // console.log(error);
    });
});

app.post('/sessionLogin', (req, res) => {
  console.log('inside sessionlogin');
  // console.log(req.body)
  const idToken = req.body.idToken.toString();
  // console.log(req.headers)
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  if (req.headers.gfuemail) {
    admin
      .auth()
      .getUserByEmail(req.headers.gfuemail)
      .then((urecord) => {
        console.log(urecord.emailVerified);
        if (urecord.emailVerified === false) {
          console.log('Email not verified');
          return res.redirect('/login');
        } else {
          console.log('Email is verified');
          admin
            .auth()
            .createSessionCookie(idToken, { expiresIn })
            .then(
              (sessionCookie) => {
                console.log('cookie validation');
                const options = { maxAge: expiresIn, httpOnly: true };
                res.cookie('session', sessionCookie, options);
                res.cookie('Gfmail', req.headers.gfuemail, options);
                res.end(JSON.stringify({ status: 'success' }));
              },
              (error) => {
                res.status(401).send('UNAUTHORIZED REQUEST!');
              }
            );
        }
      })
      .catch((err) => {
        console.log('Unable to find user with email :' + err);
      });
  }
});

app.get('/signout', (req, res) => {
  res.clearCookie('session');
  res.clearCookie('XSRF-TOKEN');
  res.clearCookie('_csrf');
  res.clearCookie('Gfmail');
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`application running on port ${port}`);
});
