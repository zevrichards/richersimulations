import React from 'react'

export const FAQ = () => {
    return (
        <div>
        
        <div className='lefttext w3-xlarge' id="#top">

            
            <a href="#XP">Guidelines for Products to be installed to X-Plane</a>
            <br/>
            <a href="#Legacy">Guidelines for Products to be installed to Legacy Sims (FSX, P3Dv1/2/3)</a>
            <br/>
            <a href="#MissingRunways">Missing Runways/Aprons</a>
            <br/>
            <a href="#CommonQuestions">Common Product Related Questions</a>
            <br/>
            <br/>

        </div>

        <div className='lefttext'>

<h1 class="w3-xxlarge w3-text-yellow" id="XP">Guidelines for Products to be installed to X-Plane</h1>
RS product can be installed by simply unzipping into the <b>X-Plane\Custom Scenery\</b> folder and then running the RSSCT setup shortcut. The tool should add the packages in the right order for you.
<br/>
If it seems that the tool does not do this automatically, X-Plane also adds them automatically to the scenery_packs.ini when it is started, but places them in the wrong order. Simply switch them to have <i>RS_Product</i> immediately <b>above</b> <i>RS_Common.</i>
<br/>

<br/><br/><div classname="center"><a href="#top">Back To Top</a></div><br/><br/>

<h1 class="w3-xxlarge w3-text-yellow" id="Legacy">Guidelines for Products to be installed to Legacy Sims (FSX, P3Dv1/2/3)</h1>

1. Install the product to any location of your choice for FSX. Some SimMarket installers DO NOT allow you to change the install directory. The product can be moved later.
<br/> 
2. When the RSSCT tool opens after install, after a few seconds of checking for updates, a red UPDATE MANAGER message will appear in the lower left hand corner. Click on it and the tool will restart. The version will now be 2.0.4.3.
<br/> 

<br/> 
<img width='50%' height="undefined" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/faq%2Fupdate%20manager.png?alt=media&token=3b3daf15-13d8-471e-83dd-3bb499fa890e"></img>
<br/> 

<br/> 

<br/> 
IMPORTANT: If the tool fails to auto-update due to connection issues the latest version can be downloaded <a class="w3-blue w3-hover-blue:hover" href="Downloads">here.</a>
<br/> 

<br/> 
3. The tool may then ask you the following:
<br/> 
if you would like to add your products to the scenery library. Click Yes.
<br/> 
if you would like to download the FSX patch for your product. Click yes. Follow the instructions carefully and install.
<br/>
<img width='50%' height="undefined" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/faq%2Fpatchforfsx.PNG?alt=media&token=abd60395-41fd-41e7-88e5-420d8c98bbbb"></img>
<br/>
<br/>
<img width='50%' height="undefined" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/faq%2FSelectFSXPatch.png?alt=media&token=1e2ddd46-7e22-43bc-b791-0edf04ff22ea"></img>
<br/> 
if you would like to install SODE. Click yes.
<br/> 

<br/> 
4. You may then proceed to install any updates for your product. This can be downloaded by clicking on the red update bar.
<br/> 
  Follow the instructions carefully (be sure to choose the option for Legacy update) and install. 
<br/> 

<br/> 
<img width='25%' height="undefined" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/faq%2Fupdate.PNG?alt=media&token=4b5becfa-9fac-4f23-b416-47c5d47c9ca7"></img>
<br/> 

<br/><br/><div classname="center"><a href="#top">Back To Top</a></div><br/><br/>
    
<br/> 
<h1 class="w3-xxlarge w3-text-yellow"id="MissingRunways">Missing Runways/Aprons</h1> 
<br/> 
Missing runways are often a symptom of incorrect SODE files or a missing product update or SODE not running on your system.
<br/> 
First verify that SODE is running in your sim by trying to access the SODE menu. 
<br/> 
 
<br/> 
Please go to Richer Simulations\Config and run the RSSCT.exe tool.
<br/> 

<br/> 
When it opens it will update to the latest version which is 2.0.4.2 and then restart after a few seconds.
<br/> 
You may have to click on the RED UPDATE MANAGER in the lower left hand corner.
<br/> 
<img width='50%' height="undefined" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/faq%2Fupdate%20manager.png?alt=media&token=3b3daf15-13d8-471e-83dd-3bb499fa890e"></img>

<br/> 
If the tool does not auto-update to v2.0.4.3, the latest version of the RSSCT tool can be downloaded <a class="w3-blue w3-hover-blue:hover" href="Downloads">here.</a>
<br/> 

<br/> 
Please also don't forget to update your scenery product to the latest version by clicking on the red update bar after it restarts:
<br/> 
<img width='25%' height="undefined" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/faq%2Fupdate.PNG?alt=media&token=4b5becfa-9fac-4f23-b416-47c5d47c9ca7"></img>

<br/> 
Your browser will open to download the update. Follow the instructions carefully and install.
<br/> 

<br/> 
Then go to the Common Setting section and click on PURGE AND REBUILD SODE settings. 
<br/> 
<img width='50%' height="undefined" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/faq%2Fcommon%20settings.png?alt=media&token=a7fa97dc-df69-4b0f-8176-02a46ea11466"></img>
<br/> 

<br/><br/><div classname="center"><a href="#top">Back To Top</a></div><br/><br/>

<h1 class="w3-xxlarge w3-text-yellow" id="CommonQuestions">Common Product Related Questions</h1>           
I. Q: After installing my product, I do not see any changes within my sim. Why? <br/>
A: Ensure that you have run the RSSCT Tool. It will add the products it finds to your Scenery Library. <br/>
Users of P3D v4+ will have it added via the add-on.xml. Users of XP11/12 will have it automatically added to scenery_packs.ini. Ensure that RS_Common is off a lower priority than your other RS products. <br/>
II. Q: The Island appears, but has no autogen. Why? <br/>
A: Ensure that the Autogen Configuration Merger has been installed or that the USE P3D AUTOGEN SYSTEM checkbox is checked <label class="notice">(Please note that P3D versions prior to v6 contain a bug where only ONE product can use custom autogen at a time.)</label>
<br/>
This is confirmed by clicking on the button in the Common Settings section of the Scenery Configuration tool.<br/>
<br/> 
<img width='50%' height="undefined" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/faq%2FUseP3DAutogen.png?alt=media&token=7f5a50fe-daeb-45d8-bb86-5c748f84c5da"></img>
<br/> 
Users of XP11/12 can download a free Autogen Upgrade Pack via the RSSCT tool. <br/>
III. Q: Is this scenery compatible with UTX, GEX and FS Global and Orbx Products? <br/>
A: Yes. This scenery does not make use of landclass and has its own custom mesh. A custom regions file is also provided to remove conflicts with Orbx regions. No conflicts should arise if they are given a higher priority in the Scenery Library. <br/>
IV. Q: Where can I find charts and other airport information? <br/>
A: Charts have been provided in the \Docs\ folder within each RS Product. <br/>

<br/><br/><div classname="center"><a href="#top">Back To Top</a></div><br/><br/>
            
        </div>

        </div>
    )
}
