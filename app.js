
var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
	Campground = require("./models/campground"),
	Comment    = require("./models/comment"),
	seedDB  = require("./seeds"),
	connectDB = require('./DB/collection.js'),
	flash   = require("connect-flash"),
	 methodOverride = require("method-override"),
	User = require("./models/user.js"),
	passport    = require("passport"),
    LocalStrategy = require("passport-local");
	
//seedDB();
/*mongoose.set('useUnifiedTopology', true);
mongoose.set('useNewUrlParser', true);*/
//mongoose.connect("mongodb://localhost/yelp_camp");
connectDB();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(require("express-session")({
	secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
	
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
    app.use(function(req, res, next){
   res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");	
		
   next();
});


app.get("/", function(req, res){
    res.render("landing");
	
});

//INDEX - show all campgrounds
app.get("/campgrounds", function(req, res){
    // Get all campgrounds from DB
	
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else {
          res.render("campgrounds/index",{campgrounds:allCampgrounds});
       }
    });
});

//CREATE - add new campground to DB
app.post("/campgrounds",isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
	var price = req.body.price;
	var author ={
		id : req.user._id,
		username:req.user.username
	}
    var newCampground = {name: name, price :price ,image: image, description: desc ,author :author}
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            res.redirect("/campgrounds");
        }
    });
});

//NEW - show form to create new campground
app.get("/campgrounds/new",isLoggedIn,function(req, res){
   res.render("campgrounds/new.ejs"); 
});

// SHOW - shows more info about one campground
app.get("/campgrounds/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
        req.flash("error","campground not found");
			res.redirect("back");

        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});
app.get("/campgrounds/:id/comments/new",isLoggedIn ,function(req, res){
    // find campground by id
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {campground: campground});
        }
    })
});
app.post("/campgrounds/:id/comments", isLoggedIn,function(req, res){
   //lookup campground using ID
   Campground.findById(req.params.id, function(err, campground){
       if(err){
           console.log(err);
           res.redirect("/campgrounds");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
			   comment.author.id = req.user._id;
			   comment.author.username=req.user.username;
			   comment.save();
               campground.comments.push(comment);
               campground.save();
			   	req.flash("success","succesfully added comment");

               res.redirect('/campgrounds/' + campground._id);
           }
        });
       }
   });
   //create new comment
   //connect new comment to campground
   //redirect campground show page
});
//auth rout

app.get("/register",function(req,res){
	
	res.render("register");
});
app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
        req.flash("error",err.message);

            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
							req.flash("success","welcome to yelpcamp"+user.username);

			
           res.redirect("/campgrounds"); 
        });
    });
});
app.get("/login",function(req,res){
	
	res.render("login");
})
app.post("/login",passport.authenticate("local",{
	
	successRedirect: "/campgrounds",
        failureRedirect: "/login"
}),function(req,res){
	
	
	
});

app.get("/logout",function(req,res){
	
	req.logout();
	req.flash("success","succesfully logout");
	res.redirect("/campgrounds");
	
});
// edit campground
app.get("/campgrounds/:id/edit",check,function(req,res)
{
	Campground.findById(req.params.id,function(err,foundCampground){
		
		if(err)
			{
				res.redirect("/campgrounds");
			}
		else
			{
				res.render("campgrounds/edit",{campground:foundCampground});
			}
		
		
		
	})
	
	
	
	
});
app.put("/campgrounds/:id",check,function(req,res){
	Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,campground){

	if(err)
		{
			res.redirect("/campgrounds");
		}
		else
			{
			req.flash("success","succesfully edit campground");

				res.redirect("/campgrounds/"+campground._id);
			}
	
	})
	
});

//campgrounds delete
app.delete("/campgrounds/:id",check,function(req,res){
	
	Campground.findByIdAndDelete(req.params.id,function(err){
		
		if(err)
			{
				res.redirect("back");
			}
		else
			{
			req.flash("success","succesfully delete campground");

				res.redirect("/campgrounds");
			}
		
	})
	
});
// comment edit

app.get("/campgrounds/:id/comment/:comment_id/edit",checkcomment,function(req,res){
	Comment.findById(req.params.comment_id,function(err,foundComment){
		
		if(err)
			{
				res.redirect("back");
			}
		else
			{
				res.render("comments/edit",{campground_id:req.params.id, comment : foundComment});
			}
		
	});
	
	
	
	
});
app.put("/campgrounds/:id/comment/:comment_id",checkcomment,function(req,res){
	
	Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,foundComment){
		
		if(err)
			{
				res.redirect("back");
			}
		else
			{
			req.flash("success","succesfully edit comment");

				res.redirect("/campgrounds/"+req.params.id);
			}
		
	});
	
});
//delete comment
app.delete("/campgrounds/:id/comment/:comment_id",checkcomment,function(req,res){
	
	Comment.findByIdAndDelete(req.params.comment_id,function(err){
		if(err)
			{
				res.redirect("back");
			}
		else
			{
			req.flash("success","successfully delete comment");

				res.redirect("/campgrounds/"+req.params.id);
			}
		
	})
	
});


//contact form 


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
	req.flash("error","you need to be login first to do that");
    res.redirect("/login");
}
function check(req,res,next)
{
	if(req.isAuthenticated())
		{
			
			Campground.findById(req.params.id,function(err,foundCampground){
				
				if(err)
					{
						req.flash("error","campground not found");
						res.redirect("back");
					}
				else
					{
						if(foundCampground.author.id.equals(req.user._id))
							{
								return next();
							}
						else
							{
								req.flash("error","you are not "+foundCampground.author.username);
								res.redirect("back");
							}
					}
				
				
				
				
			})
			
		}
	else
		{
			req.flash("error","you need to be login");
			res.redirect("back");
		}
	
	
};
function checkcomment(req,res,next)
{
	if(req.isAuthenticated())
		{
			
			Comment.findById(req.params.comment_id,function(err,foundComment){
				
				if(err)
					{
						req.flash("error","comment not found");

						res.redirect("back");
					}
				else
					{
						if(foundComment.author.id.equals(req.user._id))
							{
								return next();
							}
						else
							{
									req.flash("error","you are not"+foundComment.author.username);

								res.redirect("back");
							}
					}
				
				
				
				
			})
			
		}
	else
		{
		req.flash("error","you need to be login");

			res.redirect("back");
		}
	
	
};





app.listen(process.env.PORT||3000, process.env.IP, function(){
   console.log("The YelpCamp Server Has Started!");
});
