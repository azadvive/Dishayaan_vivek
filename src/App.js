import "./App.css"
import Header from "./components/common/header/Header"
import { Router, Switch, Route } from "./router"
import About from "./components/about/About"
import CourseHome from "./components/allcourses/CourseHome"
import ProgramDetail from "./components/allcourses/ProgramDetail"
import Team from "./components/team/Team"
import MentorDetail from "./components/team/MentorDetail"
import Pricing from "./components/pricing/Pricing"
import PathFinder from "./components/pathfinder/PathFinder"
import Partners from "./components/partners/Partners"
import Book from "./components/book/Book"
import Community from "./components/community/Community"
import NotFound from "./components/common/NotFound"
import Footer from "./components/common/footer/Footer"
import Home from "./components/home/Home"
import MentorConnect from "./components/common/MentorConnect"
import AIAssistant from "./components/common/AIAssistant"
import StickyBar from "./components/common/StickyBar"
import { I18nProvider } from "./i18n"
import { UIProvider } from "./ui"

function App() {
  return (
    <I18nProvider>
      <UIProvider>
        <Router>
          <Header />
          <main>
            <Switch>
              <Route exact path='/' component={Home} />
              <Route exact path='/about' component={About} />
              <Route exact path='/catalog' component={CourseHome} />
              <Route exact path='/program/:slug' component={ProgramDetail} />
              <Route exact path='/mentors' component={Team} />
              <Route exact path='/mentor/:slug' component={MentorDetail} />
              <Route exact path='/plans' component={Pricing} />
              <Route exact path='/pathfinder' component={PathFinder} />
              <Route exact path='/partners' component={Partners} />
              <Route exact path='/book' component={Book} />
              <Route exact path='/community' component={Community} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
          <MentorConnect />
          <AIAssistant />
          <StickyBar />
        </Router>
      </UIProvider>
    </I18nProvider>
  )
}

export default App
