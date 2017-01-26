# matching design

## stories

jobs to be done: situation - motivation - expected outcome

### vetting dash

```
When Harry wants to vet applicants,
he wants to see which applicants have not been vetted yet,
so that he can vet an applicant.
```

### profile in backend

```
When Harry wants to vet an applicant,
he wants to see the applicant's application,
so that he can decide whether they're good or not.
```

### shortlisting

```
When Harry has decided if an applicant is good or not,
he wants to record his yes/no decision,
and send out an email to the applicant,
so that the applicant can choose their preferred companies.
```

### company choice

```
When the applicant has received an email stating that they have passed the first stage of the application,
they want to see a list of companies who are taking part in the programme,
and choose their preferred companies,
so that Harry & Tab can choose what companies to send the profile to.
```

### sending out to companies

```
When Tab is matching,
she wants to generate a link for an applicant's profile,
so that she can send the applicant's profile to the company.
```

### table view

```
When Harry & Tab are logged in to the backend,
they both want to see a list of all applications,
so that they can update a certain application.
```

### search

```
When Harry & Tab are logged in to the backend,
they both want to be able to do full text search,
so that they can update a certain application.
```

### comments

```
When Harry is vetting or Tab is matching,
they both want to add a comment,
so that they both can track progress.
```

### latest events

```
When Harry is vetting or Tab is matching,
they both want to see the latest events from each application,
so that they can respond to the latest events easily (eg. new application).
```

## model

### application stages

1. unfinished
2. finished
3. rejected (reason)
4. shortlisted
5. sent to company
6. interview arranged with company
7. rejected by company
8. offer made by company
9. offer accepted by student
10. contract sent by company
11. contract signed by student

### event schema

```
timestamp : time
type : string
application : id
payload : json
```

### events initiated by applicant

```
finished

is interested in company
  company : company id

is not interested in company
  company : company id

applicant commented
  comment : string
```

### events initiated by matcher

```
commented
  comment : string

rejected
  matcher : user id

shortlisted
  matcher : user id

introduced to company
  matcher : user id
  company : company id

arranged interview
  matcher : user id
  company : company id

offer made by company
  matcher : user id
  company : company id

rejected by company
  matcher : user id
  company : company id

offer accepted
  matcher : user id
  company : company id

contract signed
  matcher : user id
  company : company id
```