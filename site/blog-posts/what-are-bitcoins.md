---
title: What are bitcoins?
author: Doogie
date: 2019-09-01
hero_image: "/src/assets/content/images/bitcoins.jpg"
---

I read so many articles about bitcoins that were either completely incomprehensible, missing the interesting details or that were even plain wrong. So I wrote my own How-to. But before we can start to talk about bitcoins, we have to start a bit earlier in time.

# What is money?

Most people use money every day without ever thinking about what money actually is. Why do we need money at all? Who created it and why?

Before there was money, there only was exchange of goods. For example: I have a sheep and I need bread. But what if someone else had bread but he needed salt and definitely had no use for a sheep. How should we get into business? Even if I had salt, how much salt would I need to trade for the bread? How much for the sheep?

So instead of trading goods both ways people started trading goods for certificates of debt in return, e.g. a certificate that says: „I owe you a sheep.“ And then someone started trading these certificates of debt both ways. Two business partners might have agreed, that one certificate of debt for a sheep has the same value as ten certificates of dept for one chocolate. This way the market created an exchange rate between the value of goods.

The last step was that someone defined a unit for one good. Just simply a number that can be written onto these certificates of dept to compare their values more easily. For example: One bar of gold is worth 1000 dollar ($).

So money is actually nothing more than an abstract unit that measures value. This unit is arbitrary in the sense that it is not precise. How much value does a sheep have in comparison to a piece of chocolate? That is not exactly measurable. This comparison is only fixed during one trade of two business partners – by these two business partners. But there is an average exchange rate over all trades.

This average also changes over time. There might be times when everyone wants chocolate and there are not many sheep left. Then chocolate might temporarily become far more „valuable“ than it actually is. This is called the market value.

So the fundamental reason why money exists is that it makes exchanging goods much simpler.

## Value of money

Up to now I always talked about the value behind these certificates of dept. Each certificate, i.e. banknote, has a certain value. This value can roughly be described as „the amount of work that is necessary to create a good of this value“. Money must have this value, otherwise it doesn’t work.

## Properties of money

For money to work at all, it has to have certain characteristics:

 - Money (banknotes) must not easily be creatable and must not be duplicatable. If anyone could just simply draw a banknote that would not work as money.
 - Every participant in the market must trust in money. Everybody must be convinced that all others also trust in this form of money. If you receive a banknote, you must trust that you will be able to buy goods for this peace of paper later on.
 - Money must have a value.

The third property is not always fulfilled nowadays …

# What are banks?

Of course everyone needs money and wants more money. So a new business arise. Some rich companies who had a lot of money (from trading goods) started to lend out their money. But of course not for free. But what can you demand from someone who doesn’t have goods and doesn’t have money (thats why he wants to borrow money)? Well the only thing you can demand is: „I will lend you XY money now, if you promise that you will give me XY+1 money in nn days!“ And this „+1“ is called interest.

But hey, did you watch carefully? Wasn’t there a rule that says it must be hard to create money. Isn’t this interest the same as creating money? There is more money afterwards as there was before?   Yes you are right. And that should be forbidden. The defense that the banks give goes like this: „We have a risk that the recipient does not pay back his dept at all. So therefore it is rightful that we earn something in this business.“

The argument in itself is true: If you lend money, then you have a risk that the recipient will not pay you back at all. But the claimed conclusion is wrong. It is still forbidden to „create“ money just for taking this risk. It breaks the system. This way more and more money is created. But since no additional value is created in this business, money looses value. This is called Inflation.

## Centralized banks

Do you still pay with cash? I pay with my credit card nearly 90% of the times. Just simply because it’s convenient. I bring all the money I earned (by creating value!) to the bank. Then I can easily spend it – via online shopping :-)

This system is completely fine. As long as you trust your bank. You must trust that they do not track your trades. But they have to. At least they have to track the sum you spent to calculate your balance. You just hope that they do not use any other information about all your shopping, e.g. what you bought from whom, when and where.

In addition to that banks take a fee for keeping your money. In Germany up to 4% for each withdrawal at the ATM. And banks don’t only silently „keep“ your money. No they work with that money. They lend it and take interest for this. So they earn money by using your money.

Banks actually lend ten times as much money as they have in stock. They just simply do and that is legal. They simply create up to nine times the money that they actually have!

# Bitcoin

What if there was a system of money that would not require a central authority? Kind of as in the old days when everyone was just trading certificates of dept. But in a secure, distributed and electronic way. That is what bitcoin is.

First of all a bitcoin is just a unit of money. Just like dollar, euro or yen. There is a exchange rate between all these currencies, also between one bitcoin and the other currencies. This exchange rate is just simply the average of what merchants currently rate this unit.

Of course bitcoin must also fulfill the properties of money that we stated above. So how does an electronic currency do that? It does it with cryptographic algorithms. So bare with me but don’t worry. This is not complicated at all.

## Properties of bitcoin

The first property of money requires that money must not easily creatable and that it must not be duplicatable. How can a digital money not be easily createable? Anyone can create bits and bytes on his computer. And how can digital money not be duplicatable? Anyone can copy anything on his computer. Solving these two problems is the genius invention of Satoshi Nakamoto.

The interesting aspect of the bitcoins solution is that all three problems (no central authority, how to create bitcoins and the double-spending) are solved  in a way that they are – kind of – entangled between the stake holders.

Before Nakamotos solution can be explained, I need to introduce one little mathematical detail. The next chapter might seem to be boring at first. But please stay with me. This is necessary and I will explain.

# Mathematical Hash Functions

A function in math is a machine that you can throw in a number as input and the machine will then return a result. A very simple machine is   f(x) = x*x   It always returns the square of its input.

Hash Functions are machines that have the following characteristics:

 - The output can be calculated rather quickly (by a computer). Even when given very large inputs (megabytes)
 - The output is smaller then the input. (e.g. always a number within a given range 0..n)
 - For one given input the output is always the same. No randomness involved. The machine is ‚deterministic‘.
 - If you change the input just a tiny bit (e.g. +1 or -1) then the output will be something completely different!

Algorithms that fullfill these characteristics actually exist, e.g. SHA-256.

 > A little test for you: What is a noteworthy consequence of these four requirements?

Answer => From the requirement that the output must be smaller than the input directly follows, that there must be at least two inputs A and B that create the same output O. From  the last requirement we can also state that A and B are quite different from each other. As a consequence it is not easy to find and example for A and B if you need one.  (Hash collision)

Now I am always talking about numbers. What does this have do to with money? Well, what is a number? For computers a number is just a sequence of zeros and ones, the binary representation of a number. This representation can be translated into the so called „base ten“ representation of numbers that you know, e.g. 123456. And every text can also be translated into numbers. The text you are currently reading is nothing more than zeros and ones on someones harddisk. This is simply done by mapping each letter to a set of zeros of ones. (ASCII Code)

### Recap

Let’s recap the main conclusion that we learned so far:

 - Money must have a value.
 - Hash functions are some funny kind of machine.
 - Texts can be represented as (binary) numbers.

But still you ask: „WTF does this have to do with money?“   Well, what would happen if you encode the text „Alice sent 10 bitcoins to Bob“ as a binary value and then you calculate the hash result of this value?

# The Blockchain

If anyone changed the text from „Alice sent 10 bitcoins to Bob“ to „Alice sent 11 bitcoins to Bob.“, then this would only be a little change. But because of requirements 4, the hash value would change dramatically. This change could easily be recognised by anyone who knows the hash value and the original text.

How much money do you have? Well you could log into your online banking and look at your account. But how do you know that the shown amount is correct? How do you know that your bank didn’t cheat at you. We’ll you don’t. You just simply have to trust your bank. You have to trust the the entry in their database is correct and that they don’t just arbitrarily change these values.

What about a digital text that says you own XY bitcoins stored on any harddrive of someone. We’ll of course you wouldn’t trust this statement at all. It could have been changed by anyone.

## The start of it all

Just for a moment let’s assume that there would be a text on your own harddrive saying:
 
 > Alice owns 10 satoshi.  Bob owns 6 satoshi. You own 30 satoshi.

For now don’t ask what a satoshi is. Let’s just assume its a small unit for a certificate of debt. And Alice and Bobs are your personal friends. Just as if the text said: „Someone ows Alice a normal pizza (value 10). Someone ows Bob a little pizza (value 6). And someone ows you a very large pizza (value 30) /or/ Three people owe you a normal pizza (value 3*10)“ And now let’s assume you trust this text. You (and all the others) believe this text to be correct. You agreed on that. For example by talking to each other while eating pizza. (BTW: This actually happend :-)    So now all three of you can calculate the (same) hash value of this ledger that states who owns how much money at that point in time.

Alice pizza has a value. It tasts nice. Between the three of you this value (the amount of work to bake this pizza of size normal) can be expressed and measured as 10 satoshi. Now Alice gives you one half of her pizza. Then you could decide to pay her in satoshi (instead of dollars) since you and her both trust in the value of satoshi and you agreed on that. So you pay here the value of 5 satoshis. So the now current version of the ledger is:

 > Alice owns 15 satoshi.  Bob owns 6 satoshi. You own 25 satoshi.

You paid 5 satoshis to Alice. But still this is just a text on your harddrive. Why should the others believe in the correctness of this text? Therefor you do a genius trick: You create a new so called block. This block is based on the initial text, that everyone agreed on. You calculate the hash value of this initial text (that everyone can easily proof to be correct) and add this to your block. Then you add a description of your transaction („You paid 5 satoshi to Alice.“) to your block. So your new block looks like this:

 - Hash value of previous block (‚link‘ to previous block)
 - New transaction(s) (Who transferred how much to whom?)

From that information the new ledger (Who now owns how much as a result?) can easily be calculated by adding and subtracting the amounts of the transfers to the ledger from the previous block. This new block you send to everyone else. Now everyone can easily check:

  1. That you new block is based on the correct predecessor (otherwise the hash value would be wrong)
  2. That you recorded only valid transactions (Sender had enough money, no double spendings etc.)
  3. And everyone can easily and quickly calculate the hash value of your block (more on this later)

If your friends (to be exact: their bitcoin clients, ie. the software running on their computers) are happy with your new block, then they will accept it as the new current block (including the new amounts in the ledger). They will base their next transactions on this block. If they are not happy with your new block, e.g. because you recorded fake transactions that you received all the money from Alice and Bob then they will discard your block.

## Recap

 - A ledger states who owns how much money
 - A block contains transactions that, when executed, create a new version of the ledger.
 - Every block is linked to a previous block via the hash value of the previous block.
 - This way the previous block, particularly the transactions in it, cannot be changed anymore. Anyone can easily check that a block is linked correctly.
 - A block contains only valid transactions. If not it will be discarded.

## How are bitcoins generated?

As we learned above, a type of money can only work if it is not easy to create a „banknote“. We already asked how can one make it not easy to create a digital bitcoin. The answer is again a genius twist: When you create and sign a new block, then you are allowed to add 50 completely new bitcoins to your own account. Just like that – out of nowhere. (If you add more, then your new block will be discarded.)

But hey, so why doesn’t just everyone do that – every second all the time? To prevent that Satoshi consciously made it artificially hard to create a new block. When you want to create a block (linked to a previous block, including transactions), then you must make sure that the hash value of your newly created block is smaller than a given upper limit. Otherwise your new block will not be accepted. But hey didn’t we say that hash values funnily jump up and down even if you change only one bit of the input? Yes they do. So it is not easy to create a block with a „small“ hashed value. But doesn’t one block (one defined input text) only have exactly one defined hash value? Yes that’s also true. So therefore it is allowed to add some arbitrary text at the end of a block (just simply some characters). This way you can create different hash values depending on which characters you add at the end. But still you do not know which suffix will create which hash values. You have to try out many (hundreds of thousands) of suffixes until you get a hash value that is small enough.   This is called mining.

## Recap

 - Creating a new block is ‚hard‘. It requires a lot of computational power. („Proof-of-Work“)
 - When you successfully create a new block, then you receive new bitcoins as a reward.
 - This reward is halved every four years.

## Upper limit to the amount of bitcoins

But didn’t we say that money looses value if you create more money (print banknotes). Yes that is still true. Therefore another rule is in place: Every four years the amount of bitcoins you get as a reward for creating a new block is cut in half. So from 50 bitcoins to 25 to (currently) 12.5 BTC and so on. So the amount of bitcoins that can exist has an upper limit. But this upper limit is not one exact figure, as so many articles falsely claim. Instead it is a pure economical decision by the miners: At some point the award for creating a new block will drop below the cost of energy to do the necessary calculations for mining new blocks. Then no new bitcoins will be created anymore.

But hey, if there are no more miners. Who will create new blocks then? Who will keep the network up and running? Luckily there is a second incentive to create new blocks:
Transaction Fees

You have to pay a fee to the node that calculates and publishes the next block. So for every transaction a certain amount of money is recorded to be transferred from A to B and in addition to that another transaction is recorded that transfers a little amount (~1%) from the sender A to the (owner of the) node that calculates the new block. (The exact details are far more complicated http://bitcoinfees.com )

So at some point in time the bitcoin network will still be running and signing blocks will be funded by transaction fees only.
Other crypto curencies

Most people don’t know, that bitcoin is only one of many crypto currencies. Some others (by trade volume):

1. Bitcoin Bitcoin, BTC
2. Ethereum Ethereum, ETH
3. Ripple Ripple, XRP
4. Bitcoin Cash, BCH
5. Tether Tether, USDT
6. Litecoin, LTC

And there are also crypto currencies that are not based on the blockchain. Instead they are based on other versions of a block chain algorithm. For example Ehtereum will soon change from proof-of-work to proof-of-stacke. And Iota uses a network of blocks, called „tangle“, to record valid transactions.

The future of electronic cash and crypto currencies is a field which is worth monitoring very closely.
